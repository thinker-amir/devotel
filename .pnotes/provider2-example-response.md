This is a example response from the provider 2.

URL: https://assignment.devotel.io/api/provider2/jobs

```json
{
  "status": "success",
  "data": {
    "jobsList": {
      "job-116": {
        "position": "Backend Engineer",
        "location": { "city": "San Francisco", "state": "NY", "remote": true },
        "compensation": { "min": 57000, "max": 104000, "currency": "USD" },
        "employer": {
          "companyName": "BackEnd Solutions",
          "website": "https://techcorp.com"
        },
        "requirements": {
          "experience": 2,
          "technologies": ["JavaScript", "Node.js", "React"]
        },
        "datePosted": "2025-07-15"
      },
      "job-367": {
        "position": "Frontend Developer",
        "location": { "city": "Austin", "state": "TX", "remote": false },
        "compensation": { "min": 72000, "max": 124000, "currency": "USD" },
        "employer": {
          "companyName": "TechCorp",
          "website": "https://dataworks.com"
        },
        "requirements": {
          "experience": 1,
          "technologies": ["HTML", "CSS", "Vue.js"]
        },
        "datePosted": "2025-07-09"
      }
    }
  }
}
```
