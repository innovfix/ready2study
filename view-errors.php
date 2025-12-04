<?php
/**
 * Error Log Viewer
 * View PHP errors to diagnose issues
 */

$errorLogPath = __DIR__ . '/error.log';
$phpErrorLog = ini_get('error_log');

?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Error Logs - Ready2Study</title>
    <style>
        body {
            font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
            background: #1e1e1e;
            color: #d4d4d4;
            margin: 0;
            padding: 20px;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
        }
        h1 {
            color: #569cd6;
            border-bottom: 2px solid #569cd6;
            padding-bottom: 10px;
        }
        .log-section {
            background: #252526;
            border: 1px solid #3e3e42;
            border-radius: 4px;
            margin: 20px 0;
            padding: 20px;
        }
        .log-section h2 {
            color: #4ec9b0;
            margin-top: 0;
        }
        pre {
            background: #1e1e1e;
            border: 1px solid #3e3e42;
            border-radius: 4px;
            padding: 15px;
            overflow-x: auto;
            max-height: 500px;
            overflow-y: auto;
            font-size: 12px;
            line-height: 1.5;
        }
        .error-line {
            color: #f48771;
        }
        .success-line {
            color: #4ec9b0;
        }
        .warning-line {
            color: #dcdcaa;
        }
        .info {
            background: #264f78;
            border-left: 3px solid #569cd6;
            padding: 10px;
            margin: 10px 0;
            border-radius: 4px;
        }
        .warning {
            background: #4d3800;
            border-left: 3px solid #dcdcaa;
            padding: 10px;
            margin: 10px 0;
            border-radius: 4px;
        }
        .error {
            background: #4b1818;
            border-left: 3px solid #f48771;
            padding: 10px;
            margin: 10px 0;
            border-radius: 4px;
        }
        button {
            background: #0e639c;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            margin: 5px;
        }
        button:hover {
            background: #1177bb;
        }
        .clear-btn {
            background: #a1260d;
        }
        .clear-btn:hover {
            background: #c72e0d;
        }
        .no-errors {
            color: #4ec9b0;
            text-align: center;
            padding: 40px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔍 Ready2Study Error Logs</h1>
        
        <div class="info">
            <strong>Log Location:</strong> <?php echo $errorLogPath; ?><br>
            <strong>File Exists:</strong> <?php echo file_exists($errorLogPath) ? '✓ Yes' : '✗ No'; ?><br>
            <?php if (file_exists($errorLogPath)): ?>
                <strong>File Size:</strong> <?php echo number_format(filesize($errorLogPath) / 1024, 2); ?> KB<br>
                <strong>Last Modified:</strong> <?php echo date('Y-m-d H:i:s', filemtime($errorLogPath)); ?>
            <?php endif; ?>
        </div>

        <div>
            <button onclick="location.reload()">🔄 Refresh Logs</button>
            <button onclick="clearLogs()" class="clear-btn">🗑️ Clear Logs</button>
            <button onclick="window.location.href='test-registration.html'">🧪 Back to Tests</button>
        </div>

        <div class="log-section">
            <h2>Application Error Log</h2>
            <?php if (file_exists($errorLogPath) && filesize($errorLogPath) > 0): ?>
                <pre><?php
                    $log = file_get_contents($errorLogPath);
                    // Highlight error lines
                    $log = htmlspecialchars($log);
                    $log = preg_replace('/^(.*error.*)$/im', '<span class="error-line">$1</span>', $log);
                    $log = preg_replace('/^(.*success.*)$/im', '<span class="success-line">$1</span>', $log);
                    $log = preg_replace('/^(.*warning.*)$/im', '<span class="warning-line">$1</span>', $log);
                    
                    // Show last 200 lines
                    $lines = explode("\n", $log);
                    $lines = array_slice($lines, -200);
                    echo implode("\n", $lines);
                ?></pre>
            <?php else: ?>
                <div class="no-errors">
                    ✓ No errors logged yet (or file doesn't exist)<br>
                    Try making a registration request first.
                </div>
            <?php endif; ?>
        </div>

        <?php if ($phpErrorLog && file_exists($phpErrorLog)): ?>
        <div class="log-section">
            <h2>PHP Error Log</h2>
            <div class="info">
                <strong>Location:</strong> <?php echo $phpErrorLog; ?><br>
                <strong>Size:</strong> <?php echo number_format(filesize($phpErrorLog) / 1024, 2); ?> KB
            </div>
            <pre><?php
                $log = file_get_contents($phpErrorLog);
                $log = htmlspecialchars($log);
                
                // Show last 100 lines
                $lines = explode("\n", $log);
                $lines = array_slice($lines, -100);
                echo implode("\n", $lines);
            ?></pre>
        </div>
        <?php endif; ?>

        <div class="log-section">
            <h2>PHP Configuration</h2>
            <pre>PHP Version: <?php echo phpversion(); ?>

Error Reporting: <?php echo ini_get('error_reporting'); ?>

Display Errors: <?php echo ini_get('display_errors') ? 'On' : 'Off'; ?>

Log Errors: <?php echo ini_get('log_errors') ? 'On' : 'Off'; ?>

Error Log: <?php echo ini_get('error_log') ?: 'Not set'; ?>

PDO Drivers: <?php echo implode(', ', PDO::getAvailableDrivers()); ?>

Max Execution Time: <?php echo ini_get('max_execution_time'); ?>s
Memory Limit: <?php echo ini_get('memory_limit'); ?>

Post Max Size: <?php echo ini_get('post_max_size'); ?>

Upload Max Filesize: <?php echo ini_get('upload_max_filesize'); ?></pre>
        </div>
    </div>

    <script>
        function clearLogs() {
            if (confirm('Are you sure you want to clear the error logs?')) {
                fetch('api/clear-logs.php', {
                    method: 'POST'
                })
                .then(response => response.json())
                .then(data => {
                    alert(data.message);
                    location.reload();
                })
                .catch(error => {
                    alert('Error clearing logs: ' + error.message);
                });
            }
        }
    </script>
</body>
</html>


