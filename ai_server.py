# Server to handle AI API requests

from flask import Flask, request, jsonify
import base64
from io import BytesIO
from pdfminer.high_level import extract_text
import cohere

app = Flask(__name__)

@app.route('/process_file', methods=['POST'])
def process_file():
    file = request.form['file']

    summary = process_pdf(file)
    
    # Process the file data here (e.g., convert binary file to text)
    response = {'data': summary}

    print(jsonify(response))
    
    return jsonify(response)


def process_pdf(file):
    # Assuming 'file' contains the Base64-encoded PDF file data received over WebSocket
    base64_data = file.encode('utf-8')  # Convert string to bytes
    pdf_data = base64.b64decode(base64_data)

    # Create a BytesIO object to work with pdfminer
    pdf_stream = BytesIO(pdf_data)

    # Extract text content from PDF
    text = extract_text(pdf_stream)

    # Print or process the extracted text content as needed
    # print("Text content of the PDF:")
    # print(text)

    # Get summary
    API_KEY = 'urUHBanFf5qq0F39mHGIPdWV9tvDqe3198WQ0Zq3'
    co = cohere.Client(API_KEY)

    # summarize transcript using Cohere
    response = co.summarize(
        text=text,
        format='bullets'
    )

    return response.summary


if __name__ == '__main__':
    # Run the Flask app on port 5000
    app.run(host='0.0.0.0', port=3001, debug=True)
