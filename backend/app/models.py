from pydantic import BaseModel, Field
from typing import List, Literal, Optional


class RectSection(BaseModel):
    type: Literal["rect"] = "rect"
    width: float = Field(0.05, description="Width in meters")
    height: float = Field(0.2, description="Height in meters")


class CircleSection(BaseModel):
    type: Literal["circle"] = "circle"
    diameter: float = Field(0.1, description="Diameter in meters")


class ISection(BaseModel):
    type: Literal["i"] = "i"
    flange_width: float = Field(0.2)
    flange_thickness: float = Field(0.02)
    web_thickness: float = Field(0.01)
    depth: float = Field(0.2)


Section = RectSection | CircleSection | ISection


class Material(BaseModel):
    name: str = "Steel"
    E: float = Field(210e9, description="Young's modulus (Pa)")
    density: float = Field(7850.0, description="Density (kg/m^3)")
    yield_strength: float = Field(250e6, description="Yield strength (Pa)")


class PointLoad(BaseModel):
    type: Literal["point"] = "point"
    magnitude: float = Field(1000.0, description="Force (N), downward positive")
    position: float = Field(2.0, description="Position from left end (m)")


class UDL(BaseModel):
    type: Literal["udl"] = "udl"
    w: float = Field(500.0, description="Load per length (N/m), downward positive")
    start: float = Field(0.0)
    end: float = Field(1.0)


class MomentLoad(BaseModel):
    type: Literal["moment"] = "moment"
    magnitude: float = Field(100.0, description="Moment (N*m), positive counter-clockwise")
    position: float = Field(1.0)


Load = PointLoad | UDL | MomentLoad


class BeamParams(BaseModel):
    length: float = Field(4.0, gt=0)
    section: Section = RectSection()
    material: Material = Material()
    num_elements: int = Field(80, ge=10, le=400)


class BeamInput(BaseModel):
    params: BeamParams
    loads: List[Load] = []


class AnalysisResult(BaseModel):
    x: List[float]
    shear: List[float]
    moment: List[float]
    deflection: List[float]
    rotation: List[float]
    stress_top: List[float]
    stress_bottom: List[float]
    max_deflection: float
    max_bending_moment: float
    reactions: List[float]


class ExportImages(BaseModel):
    shear: Optional[str] = None
    moment: Optional[str] = None
    deflection: Optional[str] = None
    snapshot3d: Optional[str] = None


class ExportPayload(BaseModel):
    params: BeamParams
    loads: List[Load]
    result: AnalysisResult
    images: ExportImages

