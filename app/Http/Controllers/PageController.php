<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class PageController extends Controller
{
    /**
     * Display the home/landing page with PDF upload
     */
    public function index()
    {
        return view('pages.index');
    }

    /**
     * Display the student info form
     */
    public function studentInfo()
    {
        return view('pages.student-info');
    }

    /**
     * Display the questions dashboard
     */
    public function dashboard()
    {
        return view('pages.dashboard');
    }

    /**
     * Display the practice test page
     */
    public function test()
    {
        return view('pages.test');
    }

    /**
     * Display the test results page
     */
    public function testResults()
    {
        return view('pages.test-results');
    }
}

