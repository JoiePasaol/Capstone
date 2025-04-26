<!DOCTYPE html>
<html>
<head>
    <title>Decline Transfer</title>
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
        .decline-container {
            text-align: center;
            padding: 30px;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            width: 400px;
            max-width: 90%;
        }
        h1 {
            color: #333;
            margin-bottom: 20px;
        }
        textarea {
            width: 100%;
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 4px;
            min-height: 100px;
            margin-bottom: 20px;
            resize: vertical;
        }
        button {
            background-color: #e74c3c;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 16px;
        }
        button:hover {
            background-color: #c0392b;
        }
        .processing {
            display: none;
        }
        .spinner {
            border: 5px solid #f3f3f3;
            border-top: 5px solid #3498db;
            border-radius: 50%;
            width: 50px;
            height: 50px;
            animation: spin 1s linear infinite;
            margin: 0 auto 20px;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    </style>
</head>
<body>
    <div class="decline-container" id="declineForm">
        <h1>Decline Transfer</h1>
        <p>Please provide a reason for declining this transfer:</p>

        <form id="declineReasonForm" action="{{ route('transfer.decline', ['id' => $id]) }}" method="POST">
            @csrf
            <input type="hidden" name="signatory_type" value="{{ $signatory_type }}">
            <textarea name="decline_reason" required placeholder="Enter your reason for declining..."></textarea>
            <button type="submit">Submit Decline</button>
        </form>
    </div>

    <div class="decline-container processing" id="processing">
        <div class="spinner"></div>
        <h1>Processing Decline</h1>
        <p>Your decline is being processed. You will be redirected to Gmail shortly...</p>
    </div>

    <script>
        document.getElementById('declineReasonForm').addEventListener('submit', function(e) {
            e.preventDefault();

            // Show processing spinner
            document.getElementById('declineForm').style.display = 'none';
            document.getElementById('processing').style.display = 'block';

            // Submit the form
            this.submit();
        });
    </script>
</body>
</html>
