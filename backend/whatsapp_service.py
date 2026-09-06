import logging
from datetime import datetime
from typing import Dict, Any, List, Optional
from backend.config import settings

# Setup logger
logger = logging.getLogger("whatsapp_service")
logger.setLevel(logging.INFO)

# Optional import of Twilio
try:
    from twilio.rest import Client
    TWILIO_AVAILABLE = True
except ImportError:
    TWILIO_AVAILABLE = False
    logger.warning("Twilio package not available. Running messaging service in simulation mode.")

def format_phone_number(phone_number: str, is_whatsapp: bool = True) -> str:
    """Format phone number for WhatsApp or SMS."""
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
    """
    Builds localized emergency alert messages in English (en), Hindi (hi), or Garhwali (gar).
    """
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
    else:  # Default English
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
    """Sends a WhatsApp alert via Twilio API."""
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
            "channel": "whatsapp",
            "language": language,
            "status": "simulated",
            "message_sid": f"SIM_WA_{datetime.utcnow().timestamp()}",
            "error": "Twilio credentials not configured. Message logged in simulation mode."
        }

    try:
        client = Client(account_sid, auth_token)
        message = client.messages.create(
            body=message_text,
            from_=format_phone_number(from_number, is_whatsapp=True),
            to=formatted_to
        )
        logger.info(f"Successfully sent WhatsApp message to {formatted_to}. SID: {message.sid}")
        return {
            "recipient": phone_number,
            "channel": "whatsapp",
            "language": language,
            "status": "sent",
            "message_sid": message.sid,
            "error": None
        }
    except Exception as e:
        error_msg = str(e)
        logger.error(f"Failed to send WhatsApp message to {formatted_to}: {error_msg}")
        return {
            "recipient": phone_number,
            "channel": "whatsapp",
            "language": language,
            "status": "failed",
            "message_sid": None,
            "error": error_msg
        }

def send_sms_alert(
    phone_number: str,
    ward_name: str,
    risk_level: str,
    safe_zone_info: str,
    language: str = "en",
    custom_details: Optional[str] = None
) -> Dict[str, Any]:
    """Sends an SMS alert via Twilio SMS API (Fallback Channel)."""
    formatted_to = format_phone_number(phone_number, is_whatsapp=False)
    message_text = build_multilingual_alert_message(ward_name, risk_level, safe_zone_info, language, custom_details)

    account_sid = settings.TWILIO_ACCOUNT_SID
    auth_token = settings.TWILIO_AUTH_TOKEN
    
    # Extract SMS phone number or fallback
    from_number = getattr(settings, "TWILIO_SMS_NUMBER", "+14155238886")
    if from_number.startswith("whatsapp:"):
        from_number = from_number.replace("whatsapp:", "")

    is_placeholder = (
        not account_sid or 
        not auth_token or 
        "your_twilio" in str(account_sid).lower() or 
        "your_auth" in str(auth_token).lower()
    )

    if not TWILIO_AVAILABLE or is_placeholder:
        logger.info(f"[SIMULATED SMS FALLBACK ({language.upper()})] To: {formatted_to} | Ward: {ward_name}")
        return {
            "recipient": phone_number,
            "channel": "sms",
            "language": language,
            "status": "simulated",
            "message_sid": f"SIM_SMS_{datetime.utcnow().timestamp()}",
            "error": "Twilio credentials not configured. SMS logged in simulation mode."
        }

    try:
        client = Client(account_sid, auth_token)
        message = client.messages.create(
            body=message_text,
            from_=from_number,
            to=formatted_to
        )
        logger.info(f"Successfully sent SMS fallback to {formatted_to}. SID: {message.sid}")
        return {
            "recipient": phone_number,
            "channel": "sms",
            "language": language,
            "status": "sent",
            "message_sid": message.sid,
            "error": None
        }
    except Exception as e:
        error_msg = str(e)
        logger.error(f"Failed to send SMS fallback to {formatted_to}: {error_msg}")
        return {
            "recipient": phone_number,
            "channel": "sms",
            "language": language,
            "status": "failed",
            "message_sid": None,
            "error": error_msg
        }

def broadcast_ward_alert(
    subscribers: List[Any],
    ward_name: str,
    risk_level: str,
    safe_zone_info: str,
    custom_details: Optional[str] = None
) -> Dict[str, Any]:
    """
    Dispatches multi-channel, multi-language alerts to subscribers.
    Attempts WhatsApp first; automatically falls back to SMS if WhatsApp fails or subscriber is not opted in.
    """
    results = []
    whatsapp_sent = 0
    sms_sent = 0
    failed_count = 0
    simulated_count = 0

    for sub in subscribers:
        phone = getattr(sub, "phone_number", "")
        lang = getattr(sub, "preferred_language", "en")
        wa_opt_in = getattr(sub, "whatsapp_opted_in", True)

        dispatch_res = None

        if wa_opt_in:
            # 1. Try WhatsApp first
            dispatch_res = send_whatsapp_alert(
                phone_number=phone,
                ward_name=ward_name,
                risk_level=risk_level,
                safe_zone_info=safe_zone_info,
                language=lang,
                custom_details=custom_details
            )

            # 2. If WhatsApp fails, execute automatic SMS fallback
            if dispatch_res["status"] == "failed":
                logger.warning(f"WhatsApp dispatch failed for {phone}. Initiating automatic SMS fallback...")
                sms_res = send_sms_alert(
                    phone_number=phone,
                    ward_name=ward_name,
                    risk_level=risk_level,
                    safe_zone_info=safe_zone_info,
                    language=lang,
                    custom_details=custom_details
                )
                sms_res["fallback_triggered"] = True
                dispatch_res = sms_res
        else:
            # Direct SMS dispatch
            dispatch_res = send_sms_alert(
                phone_number=phone,
                ward_name=ward_name,
                risk_level=risk_level,
                safe_zone_info=safe_zone_info,
                language=lang,
                custom_details=custom_details
            )

        results.append(dispatch_res)

        # Increment counts
        if dispatch_res["status"] in ["sent", "simulated"]:
            if dispatch_res["status"] == "simulated":
                simulated_count += 1
            if dispatch_res["channel"] == "whatsapp":
                whatsapp_sent += 1
            else:
                sms_sent += 1
        else:
            failed_count += 1

    return {
        "total_subscribers": len(subscribers),
        "whatsapp_sent": whatsapp_sent,
        "sms_sent": sms_sent,
        "simulated_count": simulated_count,
        "failed_count": failed_count,
        "recipient_results": results
    }
