# SuperChat
SuperChat is a web-based chat application that can summarize any text file or YouTube video. Upload your file or paste in a YouTube video link, and SuperChat will quickly generate a concise summary.
<p>
  Log into the website, then enter a chat room. At the bottom is a dynamic file upload dropbox. Upload a file, and check if the selected file (pdf, docx, txt supported) is successfully uploaded by the preview feature. You can change your selection by clicking on 'Remove' inside the box. Click on 'Summarize' and you will see the summary of the file right in the chat. You can also send a YouTube link, and a summary will be automatically created below your message.
</p>
<p align="center">
  <img width="700" alt="demogif" src="https://github.com/user-attachments/assets/d58b3895-16e4-492f-a037-833688c6060b">
</p>

### YouTube video summary
<img width="500" alt="demopic1" src="https://github.com/UBC-CPEN-322/project-imminent-squirrel/assets/84301202/910e8369-08c1-4e1f-b54a-dbe3c93ebaf7"> <br>
<img width="500" alt="demopic2" src="https://github.com/UBC-CPEN-322/project-imminent-squirrel/assets/84301202/dda6299f-6831-45ff-8a54-1bc6f6c39b93"> <br>
<img width="500" alt="demopic3" src="https://github.com/UBC-CPEN-322/project-imminent-squirrel/assets/84301202/98129141-1275-496f-a004-0edd9983669c"> <br>
<img width="500" alt="demopic4" src="https://github.com/UBC-CPEN-322/project-imminent-squirrel/assets/84301202/18297423-0fbc-4b79-9f69-afb7dc8c517b"> <br>
Error handling for videos with no transcript.

### PDF summary
<img width="500" alt="demopic5" src="https://github.com/UBC-CPEN-322/project-imminent-squirrel/assets/84301202/db5bbec3-b7ce-4e9b-bcd7-a707154f60d4">

### DOCX summary
<img width="500" alt="demopic6" src="https://github.com/UBC-CPEN-322/project-imminent-squirrel/assets/84301202/73dfcf9a-012e-4fa7-83d5-14aa2e0840b4">

### TXT summary
<img width="500" alt="demopic7" src="https://github.com/UBC-CPEN-322/project-imminent-squirrel/assets/84301202/a3b5a66c-d21a-4f7b-b379-b85749523c16">

## Design and Implementation

We use the Cohere AI summarize endpoint to summarize our messages. We considered several other APIs, including GPT-3.5-Turbo from OpenAI, Text Summarization from TextMiner. The OpenAI models are paid, and we wanted to use a free option. OpenAI also doesn’t have a dedicated summarize API; the one we would use is the Completions API that accepts a prompt, which requires input engineering. The TextMiner API doesn’t have its own website (we came across it on RapidAPI) and the documentation doesn’t look as comprehensive as the Cohere API. We also have experience using the Cohere API before, so its integration was quick. The free tier also allows 5 API calls/minute, which is more than enough for prototyping our feature. Its summarize endpoint also has parameters to customize the output. For example, we picked bullet-point, and medium length output. There is also extractiveness, which we let the model choose because we didn’t want it to possibly fixate on details and forgo a more natural sounding summary. A future functionality would be allowing the user to customize these parameters on their own. Overall, the API output is relatively accurate for files, however for YouTube videos with short transcripts (shorts or generally not many spoken words), and videos where details are explicitly, it isn’t as sensitive to those details and will miss them (e.g. in a video where the speaker’s name isn’t explicitly stated, it assumes the name that is mentioned the most is the speaker’s). We could finetune the input data further to leverage the full power of this API, but it is satisfactory for a prototype.

We accept files in .pdf, .txt, and .docx. First, we encode the file in base64 and send it to the server via an open WebSocket, then we forward that to our Python server via an HTTP POST request using axios. POST is used instead of GET because GET requests have limitations on the length of the URL and are not suitable for transferring large amounts of data. Our Python server first processes the file by converting the byte stream to a human readable string (utf-8), then makes an API call to the Cohere AI summarize endpoint to get a summary and sends the response back to the WebSocket. The client side has an event listener for messages from the WebSocket to render the summary when it receives it.

#### Multimodal Integration
Our app can also summarize YouTube videos. We first scan any text sent in the chat for a YouTube URL, then extract the videoId and send it to the Python server via an HTTP GET request. It then calls the youtube_transcript_api library to get the transcript of the video, processes the transcript for the Cohere API and calls it, then forwards the response.

#### Error handling
Exceptions thrown by the Cohere API are caught and appropriate responses are returned. Videos without transcript and therefore cannot be summarized are also properly handled.

#### Saving to the database
The files and YouTube links are saved to the database via the same persistence method as in the previous 
assignments, because we treat them and the summaries as regular messages.
