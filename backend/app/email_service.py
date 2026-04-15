import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.config import settings

def send_password_reset_email(to_email: str, reset_link: str, full_name: str | None = None) -> None:
    subject = "Recuperação de senha - PMP Sistema"

    html = f"""
    <html>
      <body>
        <p>Olá{f' {full_name}' if full_name else ''},</p>
        <p>Recebemos uma solicitação para redefinir sua senha.</p>
        <p>Clique no link abaixo para criar uma nova senha:</p>
        <p><a href="{reset_link}">{reset_link}</a></p>
        <p>Este link expira em 15 minutos.</p>
        <p>Se você não solicitou isso, ignore este e-mail.</p>
      </body>
    </html>
    """

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = settings.SMTP_FROM_EMAIL
    msg["To"] = to_email
    msg.attach(MIMEText(html, "html", "utf-8"))

    with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
        if settings.SMTP_USE_TLS:
            server.starttls()
        if settings.SMTP_USERNAME:
            server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
        server.sendmail(settings.SMTP_FROM_EMAIL, [to_email], msg.as_string())