from fastapi import APIRouter, File, UploadFile

router = APIRouter()


@router.post("/upload")
async def upload(file: UploadFile = File(...)):
    return {
        "filename": file.filename,
        "content_type": file.content_type,
        "size": len(await file.read())
    }


