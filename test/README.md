## Prerequisites (What to Download)

1.  **Python 3.10 or higher**: Download from [python.org](https://www.python.org/downloads/windows/). During installation, **make sure to check "Add Python to PATH"**.
2.  **Google Chrome**: Download from [google.com/chrome](https://www.google.com/chrome/).
3.  **The Project Servers**: Ensure you have run `npm run dev` in the root folder so the app is accessible at `http://localhost:5173`.

## Setup Instructions

1.  Open your terminal (PowerShell or CMD).
2.  Navigate to the `test` directory:
    ```powershell
    cd "c:\Users\Rifat Rahman\Videos\software\Learn-Sphere\test"
    ```
3.  Create a virtual environment:
    ```powershell
    python -m venv venv
    ```
4.  Activate the virtual environment:
    ```powershell
    .\venv\Scripts\activate
    ```
5.  Install the required dependencies:
    ```powershell
    pip install -r requirements.txt
    ```

## Running Tests & Generating Report

To run the tests and **save the results to `report.txt`**, use this command:
```powershell
pytest suite_learnsphere.py > report.txt
```

To see the results in a beautiful **HTML format** (optional):
```powershell
pytest --html=reports/report.html suite_learnsphere.py
```

## Test Cases Covered

1.  **Login Verification**: Checks authentication with admin credentials.
2.  **Global Navigation**: Verifies links between Feed, Library, and AI Tutor.
3.  **Library Filters**: Ensures department filters respond to clicks.
4.  **Resource Upload Modal**: Validates the upload interface opens correctly.
5.  **AI Explain**: Verifies the content explanation feature.
6.  **AI Practice**: Verifies the practice question generator and the presence of highlighted answers.

## Configuration

You can adjust the base URL, timeouts, and credentials in the `config.py` file.
