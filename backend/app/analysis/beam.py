from __future__ import annotations

from typing import Tuple, List
import numpy as np
from ..models import BeamInput, AnalysisResult, RectSection, CircleSection, ISection


def compute_section_properties(section) -> Tuple[float, float, float]:
    if isinstance(section, RectSection):
        b = section.width
        h = section.height
        area = b * h
        inertia = b * h ** 3 / 12.0
        c = h / 2.0
        return area, inertia, c
    if isinstance(section, CircleSection):
        d = section.diameter
        area = np.pi * (d ** 2) / 4.0
        inertia = np.pi * (d ** 4) / 64.0
        c = d / 2.0
        return area, inertia, c
    if isinstance(section, ISection):
        b = section.flange_width
        t_f = section.flange_thickness
        t_w = section.web_thickness
        h = section.depth
        area = 2 * b * t_f + (h - 2 * t_f) * t_w
        inertia = (b * h ** 3 - (b - t_w) * (h - 2 * t_f) ** 3) / 12.0
        c = h / 2.0
        return area, inertia, c
    raise ValueError("Unknown section type")


def assemble_global_stiffness(num_elems: int, L: float, EI: float) -> np.ndarray:
    dof = 2 * (num_elems + 1)
    K = np.zeros((dof, dof), dtype=float)
    Le = L / num_elems
    # Element stiffness for Euler-Bernoulli beam element
    Ke = (EI / (Le ** 3)) * np.array([
        [12, 6 * Le, -12, 6 * Le * -1],
        [6 * Le, 4 * Le ** 2, -6 * Le, 2 * Le ** 2],
        [-12, -6 * Le, 12, -6 * Le * -1],
        [-6 * Le, 2 * Le ** 2, 6 * Le, 4 * Le ** 2],
    ])
    # Correct signs for standard matrix
    Ke = (EI / (Le ** 3)) * np.array([
        [12, 6 * Le, -12, 6 * Le],
        [6 * Le, 4 * Le ** 2, -6 * Le, 2 * Le ** 2],
        [-12, -6 * Le, 12, -6 * Le],
        [6 * Le, 2 * Le ** 2, -6 * Le, 4 * Le ** 2],
    ])
    for e in range(num_elems):
        n1 = e
        n2 = e + 1
        idx = [2 * n1, 2 * n1 + 1, 2 * n2, 2 * n2 + 1]
        for i in range(4):
            for j in range(4):
                K[idx[i], idx[j]] += Ke[i, j]
    return K


def assemble_load_vector(inp: BeamInput, num_elems: int, L: float) -> np.ndarray:
    dof = 2 * (num_elems + 1)
    F = np.zeros(dof, dtype=float)
    Le = L / num_elems
    x_nodes = np.linspace(0.0, L, num_elems + 1)

    # Distributed loads -> equivalent nodal loads per element
    for load in inp.loads:
        if load.type == "udl":
            w = load.w
            start_e = max(0, int(np.floor(load.start / Le)))
            end_e = min(num_elems - 1, int(np.ceil(load.end / Le)) - 1)
            for e in range(start_e, end_e + 1):
                # Determine element coverage fraction
                x1 = e * Le
                x2 = (e + 1) * Le
                a = max(load.start, x1)
                b = min(load.end, x2)
                frac = max(0.0, b - a) / Le
                if frac <= 0:
                    continue
                # Equivalent nodal forces for UDL on full element length
                # F = w*Le/2 * [1, Le/6, 1, -Le/6]
                Fe = w * Le * frac / 2.0 * np.array([1.0, Le / 6.0, 1.0, -Le / 6.0])
                n1 = e
                n2 = e + 1
                idx = [2 * n1, 2 * n1 + 1, 2 * n2, 2 * n2 + 1]
                F[idx] += Fe
        elif load.type == "point":
            # Apply the load to nearest node as vertical force
            x0 = min(max(load.position, 0.0), L)
            node = int(round(x0 / Le))
            node = max(0, min(node, num_elems))
            F[2 * node] += load.magnitude
        elif load.type == "moment":
            x0 = min(max(load.position, 0.0), L)
            node = int(round(x0 / Le))
            node = max(0, min(node, num_elems))
            F[2 * node + 1] += load.magnitude
    return F


def apply_boundary_conditions(K: np.ndarray, F: np.ndarray, fixed_dofs: List[int]):
    all_dofs = np.arange(K.shape[0])
    free = np.setdiff1d(all_dofs, np.array(fixed_dofs))
    K_ff = K[np.ix_(free, free)]
    F_f = F[free]
    return free, K_ff, F_f


def analyze_beam(inp: BeamInput) -> AnalysisResult:
    L = inp.params.length
    area, I, c = compute_section_properties(inp.params.section)
    E = inp.params.material.E
    EI = E * I
    num_elems = inp.params.num_elements

    # Assemble
    K = assemble_global_stiffness(num_elems, L, EI)
    F = assemble_load_vector(inp, num_elems, L)

    # Simply supported beam: w(0)=0, w(L)=0 (rotations free)
    fixed_dofs = [0, 2 * (num_elems)]
    free, K_ff, F_f = apply_boundary_conditions(K, F, fixed_dofs)

    # Solve
    U = np.zeros(K.shape[0])
    U[free] = np.linalg.solve(K_ff, F_f)

    # Reactions at supports
    R = K @ U - F
    reactions = [R[0], R[2 * num_elems]]

    # Extract fields
    w_nodes = U[0::2]
    rot_nodes = U[1::2]
    x_nodes = np.linspace(0.0, L, num_elems + 1)

    # Compute curvature and moment using second derivative of deflection
    # Use central differences for interior nodes
    curvature = np.zeros_like(w_nodes)
    dx = L / num_elems
    for i in range(1, len(w_nodes) - 1):
        curvature[i] = (w_nodes[i - 1] - 2 * w_nodes[i] + w_nodes[i + 1]) / (dx ** 2)
    curvature[0] = curvature[1]
    curvature[-1] = curvature[-2]
    moment = EI * curvature

    # Shear as derivative of moment
    shear = np.zeros_like(moment)
    for i in range(1, len(moment) - 1):
        shear[i] = (moment[i + 1] - moment[i - 1]) / (2 * dx)
    shear[0] = shear[1]
    shear[-1] = shear[-2]

    # Stresses at top/bottom fibers: sigma = M * c / I (tension sign by convention)
    stress_top = moment * c / I * -1.0  # top fiber opposite sign of bottom
    stress_bottom = moment * c / I

    max_deflection = float(np.min(w_nodes, initial=0.0, where=np.ones_like(w_nodes, dtype=bool)))
    max_bending_moment = float(np.max(np.abs(moment)))

    return AnalysisResult(
        x=x_nodes.tolist(),
        shear=shear.tolist(),
        moment=moment.tolist(),
        deflection=w_nodes.tolist(),
        rotation=rot_nodes.tolist(),
        stress_top=stress_top.tolist(),
        stress_bottom=stress_bottom.tolist(),
        max_deflection=float(np.min(w_nodes)),
        max_bending_moment=max_bending_moment,
        reactions=reactions,
    )

