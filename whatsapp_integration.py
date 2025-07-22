import requests

access_token = "EAAKB3HOYzB4BPFlUY99OsdO90t1LWnaaIVl206H9X8vxm75jeS3kRowBoGZB2gZBWaDnLQIyzVULWqZBZAjbetNfwJjzRbXhdEhTrqaWXXZCxEZBk2vfcWG2U6cunDPzw9XwzRKYv1rY9GybhEXcQLvtZBVKDNI7IRgkrZBZCXHkRAD42pK4Y9IMT2oB10Qsed1hHkPC0xUyPqRrFdwEBqxP8vtSQMOtxo0vqO6gzutHVfgZDZD"  # Wstaw swój token z panelu WhatsApp
phone_number_id = "726591527199931"  # Wstaw ID numeru telefonu z panelu
recipient_number = "+491792583175"    # Wstaw swój prywatny numer 
from_number = "+15551461927"         # Testowy numer nadawcy (stały, nie zmieniaj)

url = f"https://graph.facebook.com/v15.0/{phone_number_id}/messages"
headers = {"Authorization": f"Bearer {access_token}", "Content-Type": "application/json"}
payload = {
    "messaging_product": "whatsapp",
    "to": recipient_number,
    "from": from_number,               # Dodaj pole „+15551461927" z testowym numerem
    "type": "text",
    "text": {"body": "Witaj! Twój plan treningowy: 30 min cardio. 🚀"}
}

response = requests.post(url, json=payload, headers=headers)
if response.status_code == 200:
    print("Wiadomość wysłana pomyślnie!")
else:
    print(f"Błąd: {response.status_code}, {response.text}")
