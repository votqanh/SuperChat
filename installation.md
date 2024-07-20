### Steps to run our AI feature

1. Install NodeJS dependencies using `npm install`
2. Create a virtual environment with Python interpreter v3.12.2
3. Within the virtual environment, install Python dependencies using `pip install -r requirements.txt`
4. Start a mongodb service and load the db script `initdb.mongo`
5. Start the Node server and the Python server (in the virtual environment)
6. Open `localhost:3000` and login with username `alice`, password `secret`
7. Select any chatroom
8. Try sending a youtube link, you will get a summary below the message bubble
9. Try uploading a pdf, docx, or txt file, you will also get a summary (or try the files under `AI test files`)


### Dependencies  

axios (v1.6.8)  
crypto (v1.0.1)  
express (v4.18.2)  
mongo (v0.1.0)  
mongod (v2.0.0)  
mongodb (v6.5.0)  
ws (v8.18.0)  
nodemon (v3.1.0)    

flask (v3.0.2)  
pdfminer.six (v20231228)  
cohere (v5.2.2)  
youtube_transcript_api (v0.6.2)  
python-docx (v1.1.0)

Cohere API Key: `urUHBanFf5qq0F39mHGIPdWV9tvDqe3198WQ0Zq3`
