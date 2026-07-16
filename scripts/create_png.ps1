Add-Type -AssemblyName System.Drawing
$width = 256
$height = 256
$bitmap = New-Object System.Drawing.Bitmap($width, $height)
$graphics = [System.Drawing.Graphics]::FromImage($bitmap)
$graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$graphics.Clear([System.Drawing.Color]::Transparent)

$pen = New-Object System.Drawing.Pen([System.Drawing.Color]::Black, 20)
$rect = New-Object System.Drawing.Rectangle(24, 76, 208, 104)
$graphics.DrawEllipse($pen, $rect)

$font = New-Object System.Drawing.Font("Arial", 60, [System.Drawing.FontStyle]::Bold)
$brush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::Black)
$format = New-Object System.Drawing.StringFormat
$format.Alignment = [System.Drawing.StringAlignment]::Center
$format.LineAlignment = [System.Drawing.StringAlignment]::Center
$rectF = New-Object System.Drawing.RectangleF(0, -2, 256, 256)
$graphics.DrawString("KI", $font, $brush, $rectF, $format)

$bitmap.Save("d:\MyProjects\ProductionStatisticsManager\public\ki-logo.png", [System.Drawing.Imaging.ImageFormat]::Png)
$graphics.Dispose()
$bitmap.Dispose()
Write-Host "Created public\ki-logo.png"
