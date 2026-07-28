import os
import traceback

from flask import Flask, render_template, request, jsonify
from openai import OpenAI


app = Flask(__name__)


# ==========================================================
# ENVIRONMENT
# ==========================================================

HF_TOKEN = os.getenv("HF_TOKEN")


if not HF_TOKEN:
    print("WARNING: HF_TOKEN environment variable is missing!")



# ==========================================================
# HUGGING FACE CLIENT
# ==========================================================

client = OpenAI(

    base_url="https://router.huggingface.co/v1",

    api_key=HF_TOKEN,

    timeout=120

)



MODEL = "Qwen/Qwen2.5-7B-Instruct:featherless-ai"



# ==========================================================
# HOME PAGE
# ==========================================================

@app.route("/")
def home():

    return render_template("index.html")



# ==========================================================
# CHAT API
# ==========================================================

@app.route("/chat", methods=["POST"])
def chat():


    if not HF_TOKEN:

        return jsonify({

            "success": False,

            "error":
            "HF_TOKEN environment variable is missing."

        }), 500



    data = request.get_json(silent=True)



    if not data:

        return jsonify({

            "success": False,

            "error":
            "No JSON data received."

        }), 400



    messages = data.get("messages")



    # Backwards compatibility
    # Allows old frontend requests too

    if not messages:


        old_message = data.get(
            "message",
            ""
        ).strip()



        if old_message:

            messages = [

                {

                    "role": "user",

                    "content": old_message

                }

            ]



    if not messages:


        return jsonify({

            "success": False,

            "error":
            "No messages provided."

        }), 400



    if not isinstance(messages, list):


        return jsonify({

            "success": False,

            "error":
            "Messages must be a list."

        }), 400



    try:



        completion = client.chat.completions.create(


            model=MODEL,


            messages=messages


        )



        if not completion.choices:


            return jsonify({

                "success": False,

                "error":
                "AI returned no choices."

            }), 500



        reply = (

            completion
            .choices[0]
            .message
            .content

        )



        if not reply:


            return jsonify({

                "success": False,

                "error":
                "AI returned an empty response."

            }), 500



        return jsonify({

            "success": True,

            "reply": reply

        })



    except Exception as e:


        traceback.print_exc()



        return jsonify({

            "success": False,

            "error": str(e)

        }), 500





# ==========================================================
# CONNECTION TEST
# ==========================================================

@app.route("/test")
def test():


    if not HF_TOKEN:

        return (

            "HF_TOKEN environment variable is missing.",

            500

        )



    try:


        completion = client.chat.completions.create(


            model=MODEL,


            messages=[

                {

                    "role": "user",

                    "content":
                    "Reply only with the word Hello."

                }

            ]


        )



        return (

            completion
            .choices[0]
            .message
            .content

        )



    except Exception as e:


        traceback.print_exc()


        return str(e), 500





# ==========================================================
# START SERVER
# ==========================================================

if __name__ == "__main__":


    app.run(

        host="0.0.0.0",

        port=int(
            os.environ.get(
                "PORT",
                5000
            )
        )

    )