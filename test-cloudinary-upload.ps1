# Quick Test Script for Announcement Upload

Write-Host "🧪 Testing Announcement File Upload..." -ForegroundColor Cyan

# Test data - replace these with actual IDs from your database
$testClassId = "67689f3c7f9a44001c9dc69c"  # Replace with actual class ID
$testUserId = "6768913b7f9a44001c9dc66f"   # Replace with actual user ID

# Create a test text file
$testFileName = "test-cloudinary-$(Get-Date -Format 'HHmmss').txt"
"Test file for Cloudinary upload`nCreated: $(Get-Date)" | Out-File -FilePath $testFileName -Encoding UTF8

Write-Host "📝 Creating announcement with file: $testFileName" -ForegroundColor Yellow

try {
    # Create form data for multipart upload
    $form = @{
        title = "Cloudinary Test Upload"
        content = "Testing file upload to Cloudinary storage"
        postedBy = $testUserId
        classId = $testClassId
        attachments = Get-Item -Path $testFileName
    }

    # Upload to announcements API
    $response = Invoke-RestMethod -Uri "http://localhost:5000/api/announcements" -Method POST -Form $form -ContentType "multipart/form-data"
    
    Write-Host "✅ Announcement created successfully!" -ForegroundColor Green
    Write-Host "📋 ID: $($response._id)" -ForegroundColor White
    Write-Host "📄 Title: $($response.title)" -ForegroundColor White
    
    if ($response.attachments -and $response.attachments.Count -gt 0) {
        Write-Host "`n📎 File Upload Results:" -ForegroundColor Green
        foreach ($attachment in $response.attachments) {
            Write-Host "   📄 Original Name: $($attachment.originalName)" -ForegroundColor White
            Write-Host "   💾 Size: $([math]::Round($attachment.fileSize / 1024, 2)) KB" -ForegroundColor White
            
            if ($attachment.cloudinaryUrl) {
                Write-Host "   ☁️ Cloudinary URL: $($attachment.cloudinaryUrl)" -ForegroundColor Cyan
                Write-Host "   🆔 Public ID: $($attachment.publicId)" -ForegroundColor Gray
                Write-Host "   📱 Resource Type: $($attachment.resourceType)" -ForegroundColor Gray
                
                # Test if the file is accessible
                try {
                    $testRequest = Invoke-WebRequest -Uri $attachment.cloudinaryUrl -Method HEAD
                    Write-Host "   ✅ File is accessible via Cloudinary (Status: $($testRequest.StatusCode))" -ForegroundColor Green
                } catch {
                    Write-Host "   ❌ File not accessible via Cloudinary: $($_)" -ForegroundColor Red
                }
            } else {
                Write-Host "   ⚠️ No Cloudinary URL found - check configuration!" -ForegroundColor Yellow
            }
        }
    } else {
        Write-Host "❌ No attachments found in response" -ForegroundColor Red
    }
    
    Write-Host "`n🎯 Next Steps:" -ForegroundColor Cyan
    Write-Host "1. Open your browser to http://localhost:5173" -ForegroundColor White
    Write-Host "2. Navigate to the announcements page for the test class" -ForegroundColor White
    Write-Host "3. Look for the announcement: 'Cloudinary Test Upload'" -ForegroundColor White
    Write-Host "4. Check if the file shows 'Click download to view this file'" -ForegroundColor White
    Write-Host "5. Try downloading the file to confirm it works" -ForegroundColor White

} catch {
    Write-Host "❌ Error occurred: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $statusCode = [int]$_.Exception.Response.StatusCode
        Write-Host "   HTTP Status: $statusCode" -ForegroundColor Red
        
        if ($statusCode -eq 400) {
            Write-Host "   This might be due to invalid user/class IDs" -ForegroundColor Yellow
        } elseif ($statusCode -eq 404) {
            Write-Host "   Route not found - check if backend is running" -ForegroundColor Yellow
        }
    }
} finally {
    # Clean up test file
    if (Test-Path $testFileName) {
        Remove-Item $testFileName -Force
        Write-Host "`n🧹 Cleaned up test file" -ForegroundColor Gray
    }
}

Write-Host "`n✨ Test completed!" -ForegroundColor Cyan