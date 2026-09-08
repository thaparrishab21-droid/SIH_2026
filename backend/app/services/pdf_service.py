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

    elements.append(Paragraph("SDMA / DDMA HILL-EWS OPERATIONAL HAZARD REPORT", title_style))
    elements.append(Paragraph(f"Official Monsoonal Risk Audit & Telemetry Ledger • Generated: {datetime.utcnow().strftime('%d %b %Y, %H:%M UTC')}", subtitle_style))
    elements.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#0284c7'), spaceBefore=8, spaceAfter=12))

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
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
    ]))
    elements.append(ward_table)
    elements.append(Spacer(1, 10))

    elements.append(Paragraph("1. Telemetry Sensor Readings", section_heading))
    if latest_reading:
        sensor_data = [
            [Paragraph("<b>Metric</b>", body_style), Paragraph("<b>Value</b>", body_style), Paragraph("<b>Benchmark / Status</b>", body_style)],
            [Paragraph("1-Hour Rainfall", body_style), Paragraph(f"{latest_reading.rainfall_1h_mm:.1f} mm/h", body_style), Paragraph("Normal light intensity" if latest_reading.rainfall_1h_mm < 15 else "Heavy downpour", body_style)],
            [Paragraph("24-Hour Rainfall", body_style), Paragraph(f"{latest_reading.rainfall_24h_mm:.1f} mm", body_style), Paragraph("Cumulative 24h accumulation", body_style)],
            [Paragraph("72-Hour Rainfall", body_style), Paragraph(f"{latest_reading.rainfall_72h_mm:.1f} mm", body_style), Paragraph("High saturation risk" if latest_reading.rainfall_72h_mm > 150 else "Moderate accumulation", body_style)],
            [Paragraph("Soil Moisture Saturation", body_style), Paragraph(f"{latest_reading.soil_moisture_pct:.1f}%", body_style), Paragraph("Pore pressure high" if latest_reading.soil_moisture_pct > 70 else "Normal pore pressure", body_style)],
            [Paragraph("Slope Inclinometer Angle", body_style), Paragraph(f"{latest_reading.slope_angle_deg:.1f}°", body_style), Paragraph("Steep slope acceleration" if latest_reading.slope_angle_deg > 35 else "Stable incline angle", body_style)]
        ]
        sensor_table = Table(sensor_data, colWidths=[160, 140, 240])
        sensor_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#e2e8f0')),
            ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#cbd5e1')),
            ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e2e8f0')),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ]))
        elements.append(sensor_table)
    else:
        elements.append(Paragraph("No active sensor reading data logged for this ward.", body_style))

    elements.append(Spacer(1, 10))

    elements.append(Paragraph("2. Risk Factors & Hazard Assessment", section_heading))
    if latest_risk and latest_risk.contributing_factors:
        factors = latest_risk.contributing_factors
        if isinstance(factors, str):
            factors_list = [f.strip() for f in factors.split("\n") if f.strip()]
        else:
            factors_list = factors
        
        for factor in factors_list:
            elements.append(Paragraph(f"• {factor}", body_style))
            elements.append(Spacer(1, 2))
    else:
        elements.append(Paragraph("Standard baseline risk parameters.", body_style))

    elements.append(Spacer(1, 10))

    elements.append(Paragraph("3. Historical Incident Audit", section_heading))
    if incidents:
        inc_data = [[Paragraph("<b>Date</b>", body_style), Paragraph("<b>Type</b>", body_style), Paragraph("<b>Severity</b>", body_style), Paragraph("<b>Casualties</b>", body_style), Paragraph("<b>Description</b>", body_style)]]
        for inc in incidents:
            inc_data.append([
                Paragraph(str(inc.date), body_style),
                Paragraph(str(inc.incident_type), body_style),
                Paragraph(str(inc.severity), body_style),
                Paragraph(str(inc.casualties), body_style),
                Paragraph(str(inc.description), body_style)
            ])
        inc_table = Table(inc_data, colWidths=[70, 80, 60, 60, 270])
        inc_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#f1f5f9')),
            ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#cbd5e1')),
            ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e2e8f0')),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ]))
        elements.append(inc_table)
    else:
        elements.append(Paragraph("No historical severe landslide/flood incidents logged for this ward.", body_style))

    elements.append(Spacer(1, 15))
    elements.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor('#cbd5e1'), spaceBefore=4, spaceAfter=8))
    elements.append(Paragraph("Uttarakhand State Disaster Management Authority (SDMA) • Predict Flow Automated Telemetry Service v2.0", subtitle_style))

    doc.build(elements)
    buffer.seek(0)
    return buffer.getvalue()
