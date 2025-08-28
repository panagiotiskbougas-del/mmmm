from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from fastapi import Body
from ..models import BeamInput, AnalysisResult, ExportPayload
from ..analysis.beam import analyze_beam

router = APIRouter()


@router.post("/api/analyze", response_model=AnalysisResult)
async def analyze_endpoint(payload: BeamInput = Body(...)):
    return analyze_beam(payload)


@router.websocket("/ws/analyze")
async def ws_analyze(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_json()
            payload = BeamInput(**data)
            result = analyze_beam(payload)
            await websocket.send_json(result.model_dump())
    except WebSocketDisconnect:
        return

