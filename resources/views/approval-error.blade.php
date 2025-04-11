<!DOCTYPE html>
<html>
<head>
    <title>Approval Error</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            background-color: #f5f5f5;
        }
        .error-container {
            text-align: center;
            padding: 30px;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            max-width: 500px;
        }
        h1 {
            color: #d9534f;
            margin-bottom: 20px;
        }
        p {
            color: #666;
            margin-bottom: 20px;
        }
        .error-details {
            background: #f8d7da;
            color: #721c24;
            padding: 10px;
            border-radius: 4px;
            margin-bottom: 20px;
        }
        a {
            color: #337ab7;
            text-decoration: none;
        }
    </style>
</head>
<body>
    <div class="error-container">
        <h1>Approval Failed</h1>
        <div class="error-details">
            {{ $error ?? 'An unknown error occurred' }}
        </div>
        <p>Please try again or contact support if the problem persists.</p>
        <a href="https://mail.google.com/mail/u/0/#inbox">Go to Gmail</a>
    </div>
</body>
</html>
