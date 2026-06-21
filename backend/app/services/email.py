import logging
import smtplib
from email.message import EmailMessage

from app.core.config import settings

logger = logging.getLogger(__name__)


def _build_message(to: str, subject: str, text: str, html: str) -> EmailMessage:
    msg = EmailMessage()
    msg["From"] = settings.email_from
    msg["To"] = to
    msg["Subject"] = subject
    msg.set_content(text)
    msg.add_alternative(html, subtype="html")
    return msg


def send_email(to: str, subject: str, text: str, html: str) -> None:
    """Отправка письма: console (dev) или SMTP (Yandex Cloud Postbox)."""
    if settings.email_transport == "console":
        logger.info(
            "EMAIL to=%s subject=%s\n%s\n---\n%s",
            to,
            subject,
            text,
            html,
        )
        return

    if settings.email_transport != "smtp":
        raise RuntimeError(f"Unknown email_transport: {settings.email_transport}")

    if not settings.smtp_user or not settings.smtp_password:
        raise RuntimeError("SMTP credentials are not configured")

    msg = _build_message(to, subject, text, html)
    with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=30) as smtp:
        smtp.starttls()
        smtp.login(settings.smtp_user, settings.smtp_password)
        smtp.send_message(msg)


def send_verification_email(to: str, verify_url: str) -> None:
    subject = "Подтвердите регистрацию в OhMyBudget"
    text = (
        "Здравствуйте!\n\n"
        "Подтвердите регистрацию, перейдя по ссылке:\n"
        f"{verify_url}\n\n"
        "Ссылка действует 24 часа. Если вы не регистрировались — проигнорируйте письмо.\n"
    )
    html = (
        "<p>Здравствуйте!</p>"
        "<p>Подтвердите регистрацию в <strong>OhMyBudget</strong>, нажав кнопку:</p>"
        f'<p><a href="{verify_url}" style="display:inline-block;padding:10px 16px;'
        'background:#2563eb;color:#fff;text-decoration:none;border-radius:6px">'
        "Подтвердить email</a></p>"
        f'<p>Или скопируйте ссылку: <a href="{verify_url}">{verify_url}</a></p>'
        "<p>Ссылка действует 24 часа. Если вы не регистрировались — проигнорируйте письмо.</p>"
    )
    send_email(to, subject, text, html)


def send_password_reset_email(to: str, reset_url: str) -> None:
    subject = "Сброс пароля OhMyBudget"
    text = (
        "Здравствуйте!\n\n"
        "Чтобы задать новый пароль, перейдите по ссылке:\n"
        f"{reset_url}\n\n"
        "Ссылка действует 1 час. Если вы не запрашивали сброс — проигнорируйте письмо.\n"
    )
    html = (
        "<p>Здравствуйте!</p>"
        "<p>Запрошен сброс пароля в <strong>OhMyBudget</strong>.</p>"
        f'<p><a href="{reset_url}" style="display:inline-block;padding:10px 16px;'
        'background:#2563eb;color:#fff;text-decoration:none;border-radius:6px">'
        "Задать новый пароль</a></p>"
        f'<p>Или скопируйте ссылку: <a href="{reset_url}">{reset_url}</a></p>'
        "<p>Ссылка действует 1 час. Если вы не запрашивали сброс — проигнорируйте письмо.</p>"
    )
    send_email(to, subject, text, html)


def send_email_change_email(to: str, confirm_url: str) -> None:
    subject = "Подтвердите новый email в OhMyBudget"
    text = (
        "Здравствуйте!\n\n"
        "Подтвердите смену email, перейдя по ссылке:\n"
        f"{confirm_url}\n\n"
        "Ссылка действует 24 часа. Если вы не меняли email — проигнорируйте письмо.\n"
    )
    html = (
        "<p>Здравствуйте!</p>"
        "<p>Подтвердите новый email в <strong>OhMyBudget</strong>:</p>"
        f'<p><a href="{confirm_url}" style="display:inline-block;padding:10px 16px;'
        'background:#2563eb;color:#fff;text-decoration:none;border-radius:6px">'
        "Подтвердить email</a></p>"
        f'<p>Или скопируйте ссылку: <a href="{confirm_url}">{confirm_url}</a></p>'
        "<p>Ссылка действует 24 часа.</p>"
    )
    send_email(to, subject, text, html)
