"""
PDF Incident & Telemetry Report Generator for Flood-Flash Early Warning System.
Uses ReportLab to generate official DDMA/SDMA PDF incident & risk audit reports.
"""

import io
from datetime import datetime
from typing import Any, List, Optional

from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

def generate_ward_pdf_report(
    ward: Any,
    latest_reading: Any,
    latest_risk: Any,
    incidents: List[Any],
    alerts: List[Any],
    safe_zone_info: Optional[dict] = None
) -> bytes:
    """
    Generates an official monsoonal hazard & risk audit PDF report for a ward.
    Returns raw PDF byte content.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    styles = getSampleStyleSheet()

    # Custom styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=18,
        leading=22,
        textColor=colors.HexColor('#0f172a'),
        alignment=0
    )

    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=13,
        textColor=colors.HexColor('#475569')
    )

    section_heading = ParagraphStyle(
        'SectionHeading',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=16,
        textColor=colors.HexColor('#1e293b'),
        spaceBefore=10,
        spaceAfter=6
    )

    body_style = ParagraphStyle(
        'BodyTextCustom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=12,
        textColor=colors.HexColor('#334155')
    )

    elements = []

    # Title & Subtitle Header
    elements.append(Paragraph("SDMA / DDMA HILL-EWS OPERATIONAL HAZARD REPORT", title_style))
    elements.append(Paragraph(f"Official Monsoonal Risk Audit & Telemetry Ledger • Generated: {datetime.utcnow().strftime('%d %b %Y, %H:%M UTC')}", subtitle_style))
    elements.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#0284c7'), spaceBefore=8, spaceAfter=12))

    # Ward Overview Table
    risk_lvl = (latest_risk.risk_level if latest_risk else "Safe").upper()
    risk_score = latest_risk.risk_score if latest_risk else 0.0
    safe_zone_text = safe_zone_info.get("formatted_string", ward.safe_zone_name) if safe_zone_info else ward.safe_zone_name

    ward_info_data = [
        [Paragraph("<b>Ward Name:</b>", body_style), Paragraph(f"{ward.name}", body_style), Paragraph("<b>District / State:</b>", body_style), Paragraph(f"{ward.district}, {ward.state}", body_style)],
        [Paragraph("<b>Ward ID:</b>", body_style), Paragraph(f"W-{ward.id:02d}", body_style), Paragraph("<b>Coordinates:</b>", body_style), Paragraph(f"{ward.latitude:.4f}°N, {ward.longitude:.4f}°E", body_style)],
        [Paragraph("<b>Population:</b>", body_style), Paragraph(f"{ward.population:,} residents", body_style), Paragraph("<b>Nearest Safe Zone:</b>", body_style), Paragraph(f"{safe_zone_text}", body_style)],
        [Paragraph("<b>Current Risk Level:</b>", body_style), Paragraph(f"<b>{risk_lvl}</b> (Score: {risk_score:.1f}/100)", body_style), Paragraph("<b>Status:</b>", body_style), Paragraph("ACTIVE MONSOON MONITORING", body_style)]
    ]

    ward_table = Table(ward_info_data, colWidths=[110, 160, 120, 150])
    ward_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f8fafc')),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#cbd5e1')),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e2e8f0')),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    elements.append(ward_table)
    elements.append(Spacer(1, 10))

    # Section 1: Telemetry & Sensor Snapshot
    elements.append(Paragraph("1. Telemetry & Hydro-Geotechnical Sensor Readings", section_heading))
    if latest_reading:
        sensor_data = [
            ["Metric Parameter", "Current Sensor Value", "Warning Threshold", "Status / Assessment"],
            ["72-Hour Cumulative Rain", f"{latest_reading.rainfall_72h_mm:.1f} mm", "150.0 mm", "HIGH" if latest_reading.rainfall_72h_mm > 150 else "NORMAL"],
            ["24-Hour Cumulative Rain", f"{latest_reading.rainfall_24h_mm:.1f} mm", "80.0 mm", "ELEVATED" if latest_reading.rainfall_24h_mm > 80 else "NORMAL"],
            ["1-Hour Intensity Rate", f"{latest_reading.rainfall_1h_mm:.1f} mm/h", "35.0 mm/h", "CRITICAL BURST" if latest_reading.rainfall_1h_mm >= 35 else "NORMAL"],
            ["Soil Moisture Saturation", f"{latest_reading.soil_moisture_pct:.1f}% VWC", "65.0%", "HIGH SATURATION" if latest_reading.soil_moisture_pct > 65 else "NORMAL"],
            ["Terrain Slope Angle", f"{latest_reading.slope_angle_deg:.1f}°", "35.0°", "STEEP RUNOFF SLOPE" if latest_reading.slope_angle_deg >= 35 else "MODERATE"]
        ]
        sensor_table = Table(sensor_data, colWidths=[160, 130, 120, 130])
        sensor_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1e293b')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 8),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f1f5f9')]),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ]))
        elements.append(sensor_table)
    else:
        elements.append(Paragraph("No active sensor reading record available.", body_style))

    elements.append(Spacer(1, 10))

    # Section 2: Transmitted Emergency Alert Ledger
    elements.append(Paragraph("2. Emergency Broadcast & Alert Dissemination Audit", section_heading))
    if alerts:
        alert_rows = [["Alert ID", "Timestamp (UTC)", "Severity", "Channel", "Recipients", "Triggered By"]]
        for a in alerts[:6]:
            ts = a.timestamp.strftime("%Y-%m-%d %H:%M") if hasattr(a.timestamp, "strftime") else str(a.timestamp)
            alert_rows.append([
                f"ALT-{a.id:04d}",
                ts,
                a.risk_level.upper(),
                a.channel.upper(),
                str(a.recipient_count),
                a.triggered_by[:20]
            ])
        alert_table = Table(alert_rows, colWidths=[75, 115, 75, 75, 70, 130])
        alert_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#0f172a')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 8),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f8fafc')]),
            ('TOPPADDING', (0, 0), (-1, -1), 3),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ]))
        elements.append(alert_table)
    else:
        elements.append(Paragraph("No emergency alerts transmitted for this ward in the selected period.", body_style))

    elements.append(Spacer(1, 10))

    # Section 3: Historical Incidents Log
    elements.append(Paragraph("3. Historical Landslide & Flash-Flood Breaches", section_heading))
    if incidents:
        inc_rows = [["Date", "Incident Type", "Severity", "Casualties", "Impact Description"]]
        for inc in incidents:
            inc_rows.append([
                inc.date,
                inc.incident_type.replace("_", " ").title(),
                inc.severity,
                str(inc.casualties),
                Paragraph(inc.description, body_style)
            ])
        inc_table = Table(inc_rows, colWidths=[75, 110, 65, 60, 230])
        inc_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#334155')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 8),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ]))
        elements.append(inc_table)
    else:
        elements.append(Paragraph("No historical landslide or flash-flood incidents recorded.", body_style))

    elements.append(Spacer(1, 15))
    elements.append(HRFlowable(width="100%", thickness=0.8, color=colors.HexColor('#cbd5e1'), spaceBefore=4, spaceAfter=8))
    elements.append(Paragraph("<b>End of Official Report</b> • Flood-Flash Automated DDMA Disaster Audit Service", ParagraphStyle('Footer', parent=body_style, fontSize=8, textColor=colors.HexColor('#94a3b8'), alignment=1)))

    doc.build(elements)
    pdf_data = buffer.getvalue()
    buffer.close()
    return pdf_data
