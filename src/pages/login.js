export default () => `
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login</title>
</head>

<body>
    <form action="/login" method="post" enctype="application/x-www-form-urlencoded">
        <input type="password" name="password" placeholder="Admin password">
        <input type="submit" value="Login">
    </form>
</body>
</html>
`.trim();