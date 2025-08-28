import { useMemo, useRef, useState } from 'react'
import { AppBar, Box, Button, Container, Divider, Grid, IconButton, Paper, Stack, Toolbar, Tooltip, Typography } from '@mui/material'
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import { ParametersForm, defaultInput, BeamInput } from './components/ParametersForm'
import { ChartsPanel } from './components/ChartsPanel'
import { Beam3D, Beam3DHandle } from './components/Beam3D'
import { exportPdf } from './services/api'
import { captureChartsAsBase64 } from './utils/capture'

export default function App() {
  const [input, setInput] = useState<BeamInput>(defaultInput)
  const [result, setResult] = useState<any | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const beamRef = useRef<Beam3DHandle>(null)

  const wsUrl = useMemo(() => {
    const loc = window.location
    const proto = loc.protocol === 'https:' ? 'wss' : 'ws'
    return `${proto}://${loc.host}/ws/analyze`
  }, [])

  const runAnalysis = () => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      wsRef.current?.close()
      const ws = new WebSocket(wsUrl)
      ws.onopen = () => ws.send(JSON.stringify(input))
      ws.onmessage = (ev) => {
        const data = JSON.parse(ev.data)
        setResult(data)
      }
      ws.onerror = () => {
        // Fallback to HTTP if WS fails
        fetch('/api/analyze', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) })
          .then(r => r.json()).then(setResult)
      }
      wsRef.current = ws
    } else {
      wsRef.current.send(JSON.stringify(input))
    }
  }

  const onExport = async () => {
    const charts = await captureChartsAsBase64(['shearChart', 'momentChart', 'deflectionChart'])
    const snapshot3d = await beamRef.current?.capture()
    const payload = {
      params: input.params,
      loads: input.loads,
      result,
      images: { shear: charts[0], moment: charts[1], deflection: charts[2], snapshot3d }
    }
    const blob = await exportPdf(payload)
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'beam_report.pdf'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <AppBar position="static" elevation={1}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>BeamLab</Typography>
          <Tooltip title="Export PDF">
            <span>
              <IconButton color="inherit" onClick={onExport} disabled={!result}>
                <PictureAsPdfIcon />
              </IconButton>
            </span>
          </Tooltip>
          <Button variant="contained" color="secondary" onClick={runAnalysis} startIcon={<PlayArrowIcon />}>Run</Button>
        </Toolbar>
      </AppBar>
      <Container maxWidth={false} sx={{ flex: 1, py: 2 }}>
        <Grid container spacing={2} sx={{ height: '100%' }}>
          <Grid item xs={12} md={4} lg={3}>
            <Paper sx={{ p: 2, height: '100%' }}>
              <Typography variant="subtitle1" gutterBottom>Design Parameters</Typography>
              <ParametersForm value={input} onChange={setInput} onRun={runAnalysis} />
            </Paper>
          </Grid>
          <Grid item xs={12} md={8} lg={9}>
            <Paper sx={{ p: 2, height: '60%' }}>
              <Typography variant="subtitle1" gutterBottom>Visualization</Typography>
              <Beam3D ref={beamRef} result={result} params={input.params} />
            </Paper>
            <Box sx={{ height: 12 }} />
            <Paper sx={{ p: 2, height: 'calc(40% - 12px)' }}>
              <Typography variant="subtitle1" gutterBottom>Results</Typography>
              <Divider sx={{ mb: 2 }} />
              <ChartsPanel result={result} />
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  )
}

