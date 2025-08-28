import { Box, Button, Divider, FormControl, Grid, InputLabel, MenuItem, Select, Stack, TextField, Typography } from '@mui/material'
import { useState } from 'react'

export type SectionType = 'rect' | 'circle' | 'i'

export interface BeamInput {
  params: {
    length: number
    num_elements: number
    section: any
    material: { name: string; E: number; density: number; yield_strength: number }
  }
  loads: Array<any>
}

export const defaultInput: BeamInput = {
  params: {
    length: 4,
    num_elements: 80,
    section: { type: 'rect', width: 0.05, height: 0.2 },
    material: { name: 'Steel', E: 210e9, density: 7850, yield_strength: 250e6 }
  },
  loads: [
    { type: 'udl', w: 800, start: 0.5, end: 3.5 },
    { type: 'point', magnitude: 1200, position: 2 }
  ]
}

interface Props {
  value: BeamInput
  onChange: (v: BeamInput) => void
  onRun: () => void
}

export function ParametersForm({ value, onChange, onRun }: Props) {
  const [sectionType, setSectionType] = useState<SectionType>(value.params.section.type)

  const update = (path: string, v: any) => {
    const clone = structuredClone(value)
    const parts = path.split('.')
    let ref: any = clone
    for (let i = 0; i < parts.length - 1; i++) ref = ref[parts[i]]
    ref[parts[parts.length - 1]] = v
    onChange(clone)
  }

  const sectionFields = () => {
    if (sectionType === 'rect') return (
      <Grid container spacing={1}>
        <Grid item xs={6}><TextField fullWidth size="small" label="Width b (m)" type="number" inputProps={{ step: 0.01 }} value={value.params.section.width}
          onChange={e => update('params.section.width', parseFloat(e.target.value))} /></Grid>
        <Grid item xs={6}><TextField fullWidth size="small" label="Height h (m)" type="number" inputProps={{ step: 0.01 }} value={value.params.section.height}
          onChange={e => update('params.section.height', parseFloat(e.target.value))} /></Grid>
      </Grid>
    )
    if (sectionType === 'circle') return (
      <Grid container spacing={1}>
        <Grid item xs={12}><TextField fullWidth size="small" label="Diameter d (m)" type="number" inputProps={{ step: 0.01 }} value={value.params.section.diameter}
          onChange={e => update('params.section.diameter', parseFloat(e.target.value))} /></Grid>
      </Grid>
    )
    return (
      <Grid container spacing={1}>
        <Grid item xs={6}><TextField fullWidth size="small" label="Flange width (m)" type="number" inputProps={{ step: 0.01 }} value={value.params.section.flange_width}
          onChange={e => update('params.section.flange_width', parseFloat(e.target.value))} /></Grid>
        <Grid item xs={6}><TextField fullWidth size="small" label="Depth (m)" type="number" inputProps={{ step: 0.01 }} value={value.params.section.depth}
          onChange={e => update('params.section.depth', parseFloat(e.target.value))} /></Grid>
        <Grid item xs={6}><TextField fullWidth size="small" label="Flange t (m)" type="number" inputProps={{ step: 0.005 }} value={value.params.section.flange_thickness}
          onChange={e => update('params.section.flange_thickness', parseFloat(e.target.value))} /></Grid>
        <Grid item xs={6}><TextField fullWidth size="small" label="Web t (m)" type="number" inputProps={{ step: 0.005 }} value={value.params.section.web_thickness}
          onChange={e => update('params.section.web_thickness', parseFloat(e.target.value))} /></Grid>
      </Grid>
    )
  }

  return (
    <Stack spacing={2}>
      <TextField size="small" label="Length L (m)" type="number" value={value.params.length} inputProps={{ step: 0.1 }}
        onChange={e => update('params.length', parseFloat(e.target.value))} />
      <TextField size="small" label="# Elements" type="number" value={value.params.num_elements} inputProps={{ step: 5, min: 10, max: 400 }}
        onChange={e => update('params.num_elements', parseInt(e.target.value))} />

      <FormControl size="small">
        <InputLabel>Section</InputLabel>
        <Select label="Section" value={sectionType} onChange={e => {
          const t = e.target.value as SectionType
          setSectionType(t)
          if (t === 'rect') update('params.section', { type: 'rect', width: 0.05, height: 0.2 })
          else if (t === 'circle') update('params.section', { type: 'circle', diameter: 0.1 })
          else update('params.section', { type: 'i', flange_width: 0.2, flange_thickness: 0.02, web_thickness: 0.01, depth: 0.2 })
        }}>
          <MenuItem value={'rect'}>Rectangle</MenuItem>
          <MenuItem value={'circle'}>Circle</MenuItem>
          <MenuItem value={'i'}>I-Section</MenuItem>
        </Select>
      </FormControl>

      {sectionFields()}

      <Divider />
      <Typography variant="subtitle2">Material</Typography>
      <Grid container spacing={1}>
        <Grid item xs={6}><TextField fullWidth size="small" label="E (Pa)" type="number" value={value.params.material.E}
          onChange={e => update('params.material.E', parseFloat(e.target.value))} /></Grid>
        <Grid item xs={6}><TextField fullWidth size="small" label="Yield (Pa)" type="number" value={value.params.material.yield_strength}
          onChange={e => update('params.material.yield_strength', parseFloat(e.target.value))} /></Grid>
      </Grid>

      <Divider />
      <Typography variant="subtitle2">Loads</Typography>
      <LoadEditor value={value} onChange={onChange} />

      <Box>
        <Button variant="contained" fullWidth onClick={onRun}>Run Analysis</Button>
      </Box>
    </Stack>
  )
}

function LoadEditor({ value, onChange }: { value: BeamInput; onChange: (v: BeamInput) => void }) {
  const update = (idx: number, key: string, v: any) => {
    const clone = structuredClone(value)
    ;(clone.loads as any[])[idx][key] = v
    onChange(clone)
  }
  const remove = (idx: number) => {
    const clone = structuredClone(value)
    clone.loads.splice(idx, 1)
    onChange(clone)
  }
  const add = (type: string) => {
    const clone = structuredClone(value)
    if (type === 'udl') clone.loads.push({ type: 'udl', w: 500, start: 0, end: value.params.length })
    if (type === 'point') clone.loads.push({ type: 'point', magnitude: 1000, position: value.params.length / 2 })
    if (type === 'moment') clone.loads.push({ type: 'moment', magnitude: 100, position: value.params.length / 2 })
    onChange(clone)
  }

  return (
    <Stack spacing={1}>
      {value.loads.map((load, idx) => (
        <PaperLike key={idx}>
          <Grid container spacing={1} alignItems="center">
            <Grid item xs={12} sm={3}>
              <FormControl size="small" fullWidth>
                <InputLabel>Type</InputLabel>
                <Select label="Type" value={load.type} onChange={e => update(idx, 'type', e.target.value)}>
                  <MenuItem value={'udl'}>UDL</MenuItem>
                  <MenuItem value={'point'}>Point</MenuItem>
                  <MenuItem value={'moment'}>Moment</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            {load.type === 'udl' && (
              <>
                <Grid item xs={4}><TextField size="small" fullWidth label="w (N/m)" type="number" value={load.w} onChange={e => update(idx, 'w', parseFloat(e.target.value))} /></Grid>
                <Grid item xs={4}><TextField size="small" fullWidth label="start (m)" type="number" value={load.start} onChange={e => update(idx, 'start', parseFloat(e.target.value))} /></Grid>
                <Grid item xs={4}><TextField size="small" fullWidth label="end (m)" type="number" value={load.end} onChange={e => update(idx, 'end', parseFloat(e.target.value))} /></Grid>
              </>
            )}
            {load.type === 'point' && (
              <>
                <Grid item xs={6}><TextField size="small" fullWidth label="P (N)" type="number" value={load.magnitude} onChange={e => update(idx, 'magnitude', parseFloat(e.target.value))} /></Grid>
                <Grid item xs={6}><TextField size="small" fullWidth label="x (m)" type="number" value={load.position} onChange={e => update(idx, 'position', parseFloat(e.target.value))} /></Grid>
              </>
            )}
            {load.type === 'moment' && (
              <>
                <Grid item xs={6}><TextField size="small" fullWidth label="M (N*m)" type="number" value={load.magnitude} onChange={e => update(idx, 'magnitude', parseFloat(e.target.value))} /></Grid>
                <Grid item xs={6}><TextField size="small" fullWidth label="x (m)" type="number" value={load.position} onChange={e => update(idx, 'position', parseFloat(e.target.value))} /></Grid>
              </>
            )}
            <Grid item xs={12} sm={2}><Button color="error" fullWidth size="small" onClick={() => remove(idx)}>Remove</Button></Grid>
          </Grid>
        </PaperLike>
      ))}
      <Stack direction="row" spacing={1}>
        <Button variant="outlined" size="small" onClick={() => add('udl')}>Add UDL</Button>
        <Button variant="outlined" size="small" onClick={() => add('point')}>Add Point</Button>
        <Button variant="outlined" size="small" onClick={() => add('moment')}>Add Moment</Button>
      </Stack>
    </Stack>
  )
}

function PaperLike({ children }: { children: any }) {
  return (
    <Box sx={{ p: 1.5, borderRadius: 1, bgcolor: 'rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.08)' }}>{children}</Box>
  )
}

