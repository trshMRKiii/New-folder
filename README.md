# 🚀 iTURNO: Centralize Transport Operations and Reward System for North Central Terminal of San Fernando City, La Union

A modern web application that helps personnel manage tasks efficiently with a clean UI and powerful backend integration.

---

## 📑 Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
- [API Reference](#api-reference)
- [Acknowledgments](#acknowledgments)

---

## ✨ Features

- Dashboard with analytics
- Secure authentication (JWT-based)
- RESTful API with JSON responses
- Responsive UI built with React
- Ticketing (Current and Late issuance of ticket)
- Dispatching (First In, First Out)
- Collection (Batch verification, Override access for admin)
- Searching
- Filtering
- Granting Access (Personnel Asks)
- Public Viewing (Active Queue and Next Queue)
- Reporting (CSV and PDF)

---

## ⚙️ Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/trshMRKiii/iTURNO
cd iTURNO
npm install

---

## ▶️ Usage

On terminal or Command Prompt

Start the Api server:
bash
cd backend
py manage.py runserver

Build for production:
bash
npm run dev

---

## 📡 API Reference

Api Root:
http://127.0.0.1:8000/api/

  {
	"users": "http://127.0.0.1:8000/api/users/",
    	"drivers": "http://127.0.0.1:8000/api/drivers/",
   	"routes": "http://127.0.0.1:8000/api/routes/",
   	"vehicles": "http://127.0.0.1:8000/api/vehicles/",
 	"tickets": "http://127.0.0.1:8000/api/tickets/",
   	"ticketPrice": "http://127.0.0.1:8000/api/ticketPrice/"
  }

PUT schedule:
http://127.0.0.1:8000/api/schedules/

GET Report:
http://127.0.0.1:8000/api/report/summary/
http://127.0.0.1:8000/api/report/collections/
http://127.0.0.1:8000/api/report/chart/
http://127.0.0.1:8000/api/logs/

GET dashboard:
http://127.0.0.1:8000/api/dashboard/stats/

GET public queue:
http://127.0.0.1:8000/api/queue/

--

## Acknowledgement:
We would like to express our sincere gratitude to God for the guidance, strength, and wisdom throughout the development of this project.

We also extend our heartfelt thanks to the Office for Public Safety for their support and cooperation.

Special thanks to Sir Fernando Jose Bautista, our course instructor, for his guidance, encouragement, and valuable insights during the completion of this project.

We are also grateful to our groupmates for their hard work, cooperation, and contributions, as well as to our friends who supported and motivated us throughout this journey.

This project would not have been possible without all of your support and encouragement.
```
