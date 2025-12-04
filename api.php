<?php
/**
 * Simple API Router for Static HTML Files
 * This file handles API requests when Laravel routes aren't accessible
 */

// Only process if this is an API request
if (strpos($_SERVER['REQUEST_URI'], '/api/') !== false) {
    // Load Laravel bootstrap
    require __DIR__ . '/vendor/autoload.php';
    
    $app = require_once __DIR__ . '/bootstrap/app.php';
    $kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);
    
    $response = $kernel->handle(
        $request = Illuminate\Http\Request::capture()
    );
    
    $response->send();
    $kernel->terminate($request, $response);
    exit;
}


