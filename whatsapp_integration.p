
import requests

access_token = "TWÓJ_ACCESS_TOKEN"  # Wstaw token z panelu WhatsApp
phone_number_id = "726591527199931"  # Wstaw ID numeru telefonu
recipient_number = "1 555 146 1927"    # Wstaw swój numer

url = f"https://graph.facebook.com/v15.0/{phone_number_id}/messages"
headers = {"Authorization": f"Bearer {access_token}", "Content-Type": "application/json"}
payload = {
    "messaging_product": "whatsapp",
    "to": recipient_number,
    "type": "text",
    "text": {"body": "Witaj! Twój plan treningowy: 30 min cardio. 🚀"}
}

response = requests.post(url, json=payload, headers=headers)
if response.status_code == 200:
    print("Wiadomość wysłana pomyślnie!")
else:
    print(f"Błąd: {response.status_code}, {response.text}")x
