import logging
from datetime import datetime
from typing import Dict, Any, List, Optional
from backend.app.config import settings

logger = logging.getLogger("whatsapp_service")
logger.setLevel(logging.INFO)

try:
    from twilio.rest import Client
    TWILIO_AVAILABLE = True
except ImportError:
    TWILIO_AVAILABLE = False
    logger.warning("Twilio package not available. Running messaging service in simulation mode.")

def format_phone_number(phone_number: str, is_whatsapp: bool = True) -> str:
    cleaned = phone_number.strip()
    if is_whatsapp:
        if not cleaned.startswith("whatsapp:"):
            if not cleaned.startswith("+"):
                cleaned = f"+{cleaned}"
            cleaned = f"whatsapp:{cleaned}"
        return cleaned
    else:
        if cleaned.startswith("whatsapp:"):
            cleaned = cleaned.replace("whatsapp:", "")
        if not cleaned.startswith("+"):
            cleaned = f"+{cleaned}"
        return cleaned

def build_multilingual_alert_message(
    ward_name: str,
    risk_level: str,
    safe_zone_info: str,
    language: str = "en",
    custom_details: Optional[str] = None
) -> str:
    timestamp_str = datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC")
    risk_upper = risk_level.upper()

    if language == "hi":
        details = custom_details or "भारी वर्षा एवं मिट्टी की उच्च नमी का खतरा दर्ज किया गया है।"
        message = (
            f"⚠️ [{risk_upper}] चेतावनी — {ward_name}\n\n"
            f"{details}\n\n"
            f"🏃 सुरक्षित स्थान: कृपया तुरंत {safe_zone_info} की ओर जाएं और प्रशासन के निर्देशों का पालन करें।\n\n"
            f"🕒 समय: {timestamp_str}"
        )
    elif language == "gar":
        details = custom_details or "भारी बरखा अर पहाड़ खिसकण को बडू खतरा पैदा होइगे।"
        message = (
            f"⚠️ [{risk_upper}] चेतावनी — {ward_name}\n\n"
            f"{details}\n\n"
            f"🏃 सुरक्षित ठौर: तुरंत {safe_zone_info} तरफ जावा अर प्रशासन की बात सुना।\n\n"
            f"🕒 समय: {timestamp_str}"
        )
    else:
        details = custom_details or "Heavy rainfall and elevated soil saturation detected in your ward."
        message = (
            f"⚠️ [{risk_upper}] Alert — {ward_name}\n\n"
            f"{details}\n\n"
            f"🏃 SAFE ZONE: Please move towards {safe_zone_info} and follow local authority instructions.\n\n"
            f"🕒 Updated: {timestamp_str}"
        )
    
    return message

def send_whatsapp_alert(
    phone_number: str,
    ward_name: str,
    risk_level: str,
    safe_zone_info: str,
    language: str = "en",
    custom_details: Optional[str] = None
) -> Dict[str, Any]:
    formatted_to = format_phone_number(phone_number, is_whatsapp=True)
    message_text = build_multilingual_alert_message(ward_name, risk_level, safe_zone_info, language, custom_details)

    account_sid = settings.TWILIO_ACCOUNT_SID
    auth_token = settings.TWILIO_AUTH_TOKEN
    from_number = settings.TWILIO_WHATSAPP_NUMBER

    is_placeholder = (
        not account_sid or 
        not auth_token or 
        "your_twilio" in str(account_sid).lower() or 
        "your_auth" in str(auth_token).lower()
    )

    if not TWILIO_AVAILABLE or is_placeholder:
        logger.info(f"[SIMULATED WHATSAPP ALERT ({language.upper()})] To: {formatted_to} | Ward: {ward_name}")
        return {
            "recipient": phone_number,
            "formatted_to": formatted_to,
            "channel": "whatsapp",
            "language": language,
            "status": "sent (simulated)",
            "message_text": message_text,
            "timestamp": datetime.utcnow().isoformat()
        }

    try:
        client = Client(account_sid, auth_token)
        message = client.messages.create(
            body=message_text,
            from_=from_number,
            to=formatted_to
        )
        logger.info(f"Twilio WhatsApp alert dispatched successfully to {formatted_to}. SID: {message.sid}")
        return {
            "recipient": phone_number,
            "formatted_to": formatted_to,
            "channel": "whatsapp",
            "language": language,
            "status": "sent",
            "message_sid": message.sid,
            "message_text": message_text,
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        logger.error(f"Twilio API call failed for {phone_number}: {e}")
        return {
            "recipient": phone_number,
            "formatted_to": formatted_to,
            "channel": "whatsapp",
            "language": language,
            "status": f"failed ({str(e)})",
            "message_text": message_text,
            "timestamp": datetime.utcnow().isoformat()
        }
