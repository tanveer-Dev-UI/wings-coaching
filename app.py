from __future__ import annotations

import datetime as dt
import json
import os
import re
import uuid
import urllib.parse
from pathlib import Path

from flask import Flask, abort, jsonify, request, send_from_directory

ROOT = Path(__file__).resolve().parent
DATA_DIR = ROOT / "data"
LEADS_FILE = DATA_DIR / "leads.jsonl"
DATA_DIR.mkdir(exist_ok=True)

WHATSAPP_NUMBER = os.getenv("WINGS_WHATSAPP_NUMBER", "919559752997")
PHONE_RE = re.compile(r"^\d{10}$")
ALLOWED_ASSET_EXTENSIONS = {
    ".html",
    ".css",
    ".js",
    ".webp",
    ".png",
    ".jpg",
    ".jpeg",
    ".svg",
    ".ico",
    ".json",
    ".txt",
    ".map",
}

app = Flask(__name__, static_folder=str(ROOT), static_url_path="")


def _clean(value: object) -> str:
    return str(value or "").strip()


def _build_whatsapp_message(lead: dict[str, str]) -> str:
    return "\n".join(
        [
            "*New Wings Coaching Lead*",
            f"Enquiry Type: {lead['enquiryType']}",
            f"Student Name: {lead['name']}",
            f"Parent Name: {lead['parentName']}",
            f"Class: {lead['grade']}",
            f"Phone: {lead['phone']}",
            f"Preferred Time: {lead.get('preferredTime') or 'Not Provided'}",
            f"Message: {lead.get('message') or 'Not Provided'}",
            "Source: Website Form",
            f"Submitted At: {lead['timestamp']}",
        ]
    )


def _safe_static(path: str):
    candidate = (ROOT / path).resolve()
    if not candidate.exists() or not candidate.is_file():
        abort(404)
    if ROOT not in candidate.parents:
        abort(404)
    if candidate.suffix.lower() not in ALLOWED_ASSET_EXTENSIONS:
        abort(404)
    return send_from_directory(ROOT, path)


@app.get("/api/health")
def health():
    return jsonify({"ok": True, "service": "wings-backend"})


@app.post("/api/enquiry")
def create_enquiry():
    payload = request.get_json(silent=True) or {}
    lead = {
        "id": uuid.uuid4().hex[:12],
        "timestamp": dt.datetime.now(dt.timezone(dt.timedelta(hours=5, minutes=30))).strftime(
            "%Y-%m-%d %H:%M:%S IST"
        ),
        "enquiryType": _clean(payload.get("enquiryType")),
        "name": _clean(payload.get("name")),
        "parentName": _clean(payload.get("parentName")),
        "grade": _clean(payload.get("grade")),
        "phone": _clean(payload.get("phone")),
        "preferredTime": _clean(payload.get("preferredTime")),
        "message": _clean(payload.get("message")),
        "source": _clean(payload.get("source")) or "website",
    }

    if not all([lead["enquiryType"], lead["name"], lead["parentName"], lead["grade"]]):
        return jsonify({"ok": False, "error": "Missing required fields"}), 400
    if not PHONE_RE.match(lead["phone"]):
        return jsonify({"ok": False, "error": "Phone must be 10 digits"}), 400

    with LEADS_FILE.open("a", encoding="utf-8") as fp:
        fp.write(json.dumps(lead, ensure_ascii=True) + "\n")

    wa_message = _build_whatsapp_message(lead)
    wa_url = f"https://wa.me/{WHATSAPP_NUMBER}?text={urllib.parse.quote(wa_message)}"
    return jsonify({"ok": True, "lead_id": lead["id"], "wa_url": wa_url})


@app.get("/")
def home():
    return send_from_directory(ROOT, "index.html")


@app.get("/<path:path>")
def static_files(path: str):
    return _safe_static(path)


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
