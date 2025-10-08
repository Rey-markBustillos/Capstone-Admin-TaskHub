# Test file upload using PowerShell
$uri = "http://localhost:5000/api/files/extract-text"
$filePath = "c:\xampp\htdocs\Capstone-Admin-TaskHub\test-document.txt"

# Create multipart form data
$boundary = [System.Guid]::NewGuid().ToString()
$LF = "`r`n"

$bodyLines = (
    "--$boundary",
    "Content-Disposition: form-data; name=`"file`"; filename=`"test-document.txt`"",
    "Content-Type: text/plain$LF",
    [System.IO.File]::ReadAllText($filePath),
    "--$boundary--$LF"
) -join $LF

try {
    $response = Invoke-RestMethod -Uri $uri -Method Post -Body $bodyLines -ContentType "multipart/form-data; boundary=$boundary"
    Write-Host "Success: $($response | ConvertTo-Json -Depth 3)"
} catch {
    Write-Host "Error: $($_.Exception.Message)"
    Write-Host "Response: $($_.Exception.Response)"
}