# Test script to verify announcement file upload to Cloudinary

Write-Host "🧪 Testing Announcement Upload to Cloudinary..." -ForegroundColor Cyan

# Configuration
$baseUrl = "http://localhost:5000/api"
$testClassId = "67689f3c7f9a44001c9dc69c"  # Replace with actual class ID
$testUserId = "6768913b7f9a44001c9dc66f"   # Replace with actual user ID

# Create a test text file
$testFilePath = "test-announcement.txt"
"This is a test file for announcement upload to Cloudinary.`nTimestamp: $(Get-Date)" | Out-File -FilePath $testFilePath -Encoding UTF8

try {
    Write-Host "📝 Creating test announcement with file attachment..." -ForegroundColor Yellow
    
    # Create multipart form data
    $form = @{
        title = "Test Cloudinary Upload"
        content = "Testing file upload to Cloudinary storage for announcements"
        postedBy = $testUserId
        classId = $testClassId
        attachments = Get-Item -Path $testFilePath
    }

    # Make POST request to create announcement with file
    $response = Invoke-RestMethod -Uri "$baseUrl/announcements" -Method POST -Form $form -ContentType "multipart/form-data"
    
    Write-Host "✅ Announcement created successfully!" -ForegroundColor Green
    Write-Host "📋 Announcement ID: $($response._id)" -ForegroundColor White
    
    if ($response.attachments -and $response.attachments.Count -gt 0) {
        Write-Host "📎 Attachments found:" -ForegroundColor Green
        foreach ($attachment in $response.attachments) {
            Write-Host "   📄 File: $($attachment.originalName)" -ForegroundColor White
            Write-Host "   💾 Size: $([math]::Round($attachment.fileSize / 1024, 2)) KB" -ForegroundColor White
            Write-Host "   🔗 Filename: $($attachment.filename)" -ForegroundColor White
            if ($attachment.cloudinaryUrl) {
                Write-Host "   ☁️ Cloudinary URL: $($attachment.cloudinaryUrl)" -ForegroundColor Cyan
                Write-Host "   🆔 Public ID: $($attachment.publicId)" -ForegroundColor Cyan
                Write-Host "   📱 Resource Type: $($attachment.resourceType)" -ForegroundColor Cyan
            } else {
                Write-Host "   ⚠️ No Cloudinary URL found (might be stored locally)" -ForegroundColor Yellow
            }
        }
    } else {
        Write-Host "❌ No attachments found in response" -ForegroundColor Red
    }

    Write-Host "`n🔍 Testing file retrieval..." -ForegroundColor Yellow
    $getResponse = Invoke-RestMethod -Uri "$baseUrl/announcements/$($response._id)" -Method GET
    
    if ($getResponse.attachments -and $getResponse.attachments.Count -gt 0) {
        Write-Host "✅ File retrieval successful!" -ForegroundColor Green
        foreach ($attachment in $getResponse.attachments) {
            if ($attachment.cloudinaryUrl) {
                Write-Host "☁️ Cloudinary URL accessible: $($attachment.cloudinaryUrl)" -ForegroundColor Green
                
                # Test if Cloudinary URL is accessible
                try {
                    $testRequest = Invoke-WebRequest -Uri $attachment.cloudinaryUrl -Method HEAD
                    Write-Host "✅ Cloudinary file accessible (Status: $($testRequest.StatusCode))" -ForegroundColor Green
                } catch {
                    Write-Host "❌ Cloudinary file not accessible: $_" -ForegroundColor Red
                }
            }
        }
    }

} catch {
    Write-Host "❌ Error occurred: $_" -ForegroundColor Red
    if ($_.Exception.Response) {
        $statusCode = $_.Exception.Response.StatusCode
        Write-Host "   Status Code: $statusCode" -ForegroundColor Red
    }
} finally {
    # Cleanup test file
    if (Test-Path $testFilePath) {
        Remove-Item $testFilePath -Force
        Write-Host "🧹 Cleaned up test file" -ForegroundColor Gray
    }
}

Write-Host "`n✨ Test completed!" -ForegroundColor Cyan