Add-Type -AssemblyName System.Drawing

function Generate-Icon([int]$size, [string]$path, [bool]$maskable) {
    $bmp = New-Object System.Drawing.Bitmap($size, $size)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit

    # Background
    $bgBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(2, 6, 23)) # Slate-950
    $g.FillRectangle($bgBrush, 0, 0, $size, $size)

    # Padding
    $pad = if ($maskable) { [int]($size * 0.15) } else { [int]($size * 0.08) }
    $innerW = $size - (2 * $pad)
    $innerH = $size - (2 * $pad)

    # Gold circular / rounded frame
    $goldPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(245, 158, 11), [float]($size * 0.025))
    $g.DrawEllipse($goldPen, $pad, $pad, $innerW, $innerH)

    # Inner subtle glow
    $glowPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(40, 245, 158, 11), [float]($size * 0.04))
    $g.DrawEllipse($glowPen, $pad + 4, $pad + 4, $innerW - 8, $innerH - 8)

    # Pediment / Roof Triangle
    $pedimentH = $size * 0.35
    $roofPoints = @(
        [System.Drawing.PointF]::new($size * 0.5, $size * 0.28),
        [System.Drawing.PointF]::new($size * 0.28, $pedimentH),
        [System.Drawing.PointF]::new($size * 0.72, $pedimentH)
    )
    $goldBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(245, 158, 11))
    $g.FillPolygon($goldBrush, $roofPoints)

    # Base of Pediment
    $beamPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(245, 158, 11), [float]($size * 0.02))
    $g.DrawLine($beamPen, [float]($size * 0.26), [float]$pedimentH, [float]($size * 0.74), [float]$pedimentH)

    # 4 Columns
    $colPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(217, 119, 6), [float]($size * 0.03))
    $colTop = $pedimentH + ($size * 0.02)
    $colBottom = $size * 0.54
    $colX1 = [float]($size * 0.32)
    $colX2 = [float]($size * 0.44)
    $colX3 = [float]($size * 0.56)
    $colX4 = [float]($size * 0.68)
    $colX = @($colX1, $colX2, $colX3, $colX4)
    foreach ($x in $colX) {
        $g.DrawLine($colPen, [float]$x, [float]$colTop, [float]$x, [float]$colBottom)
    }

    # Base steps
    $stepPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(245, 158, 11), [float]($size * 0.02))
    $g.DrawLine($stepPen, [float]($size * 0.28), [float]$colBottom, [float]($size * 0.72), [float]$colBottom)
    $g.DrawLine($stepPen, [float]($size * 0.24), [float]($colBottom + $size * 0.025), [float]($size * 0.76), [float]($colBottom + $size * 0.025))

    # Text "1996"
    $fontSize = [float]($size * 0.11)
    $font = New-Object System.Drawing.Font("Georgia", $fontSize, [System.Drawing.FontStyle]::Bold)
    $sf = New-Object System.Drawing.StringFormat
    $sf.Alignment = [System.Drawing.StringAlignment]::Center
    $sf.LineAlignment = [System.Drawing.StringAlignment]::Center

    $textBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(254, 243, 199)) # amber-100
    $g.DrawString("1996", $font, $textBrush, [float]($size * 0.5), [float]($size * 0.68), $sf)

    # Subtext "ST-BERNARD"
    $subFontSize = [float]($size * 0.045)
    $subFont = New-Object System.Drawing.Font("Arial", $subFontSize, [System.Drawing.FontStyle]::Bold)
    $subBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(245, 158, 11))
    $g.DrawString("ST-BERNARD", $subFont, $subBrush, [float]($size * 0.5), [float]($size * 0.79), $sf)

    $g.Dispose()
    $bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
}

Generate-Icon 192 "public/icons/icon-192x192.png" $false
Generate-Icon 512 "public/icons/icon-512x512.png" $false
Generate-Icon 512 "public/icons/icon-maskable-512x512.png" $true
Generate-Icon 180 "public/icons/apple-touch-icon.png" $false
Write-Output "ICONS_GENERATED_OK"
