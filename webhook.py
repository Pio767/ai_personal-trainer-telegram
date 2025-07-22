from flask import Flask, request

app = Flask(__name__)

@app.route('/webhook', methods=['GET', 'POST'])
def webhook():
    if request.method == 'GET':
        verify_token = "vorr123"  # Ustalony token
        mode = request.args.get("hub.mode")
        token = request.args.get("hub.verify_token")
        challenge = request.args.get("hub.challenge")

        if mode == "subscribe" and token == verify_token:
            print("✅ Webhook potwierdzony przez Meta.")
            return challenge, 200
        else:
            return "❌ Błędny token", 403

    if request.method == 'POST':
        data = request.get_json()
        print("\n📩 Odebrano wiadomość:")
        print(data)
        return "OK", 200

if __name__ == '__main__':
    app.run(port=5000)

