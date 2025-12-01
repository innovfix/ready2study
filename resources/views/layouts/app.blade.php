<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>@yield('title', 'Ready2Study - Transform PDFs into Study Material')</title>
    <link rel="stylesheet" href="{{ asset('css/style.css') }}">
    @stack('styles')
</head>

<body>
    @include('partials._header')

    <main class="@yield('main-class', '')">
        @yield('content')
    </main>

    @include('partials._loader')
    
    @stack('modals')

    <!-- Scripts -->
    <script src="{{ asset('js/mockData.js') }}"></script>
    @stack('scripts')
</body>

</html>

