import { Box, Grid } from '@mui/material'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { Line } from 'react-chartjs-2'
import { useMemo } from 'react'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend)

export function ChartsPanel({ result }: { result: any | null }) {
  const x = result?.x ?? []
  const moment = result?.moment ?? []
  const shear = result?.shear ?? []
  const deflection = result?.deflection ?? []

  const common = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: { x: { title: { display: true, text: 'x (m)' } } }
  } as const

  const shearData = useMemo(() => ({ labels: x, datasets: [{ label: 'V(x) (N)', data: shear, borderColor: '#0d47a1', tension: 0 }] }), [x, shear])
  const momentData = useMemo(() => ({ labels: x, datasets: [{ label: 'M(x) (N·m)', data: moment, borderColor: '#00bfa5', tension: 0 }] }), [x, moment])
  const deflectionData = useMemo(() => ({ labels: x, datasets: [{ label: 'w(x) (m)', data: deflection, borderColor: '#ef6c00', tension: 0 }] }), [x, deflection])

  return (
    <Grid container spacing={2} sx={{ height: '100%' }}>
      <Grid item xs={12} md={4} sx={{ height: { xs: 200, md: '100%' } }}>
        <Box id="shearChart" sx={{ height: '100%' }}>
          <Line data={shearData} options={{ ...common, scales: { ...common.scales, y: { title: { display: true, text: 'Shear (N)' } } } }} />
        </Box>
      </Grid>
      <Grid item xs={12} md={4} sx={{ height: { xs: 200, md: '100%' } }}>
        <Box id="momentChart" sx={{ height: '100%' }}>
          <Line data={momentData} options={{ ...common, scales: { ...common.scales, y: { title: { display: true, text: 'Moment (N·m)' } } } }} />
        </Box>
      </Grid>
      <Grid item xs={12} md={4} sx={{ height: { xs: 200, md: '100%' } }}>
        <Box id="deflectionChart" sx={{ height: '100%' }}>
          <Line data={deflectionData} options={{ ...common, scales: { ...common.scales, y: { title: { display: true, text: 'Deflection (m)' } } } }} />
        </Box>
      </Grid>
    </Grid>
  )
}

