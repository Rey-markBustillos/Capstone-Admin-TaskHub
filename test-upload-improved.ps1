# Improved test file upload using PowerShell
param(
    [string]$FilePath = "c:\xampp\htdocs\Capstone-Admin-TaskHub\test-document.txt"
)

$uri = "http://localhost:5000/api/files/extract-text"

# Check if file exists
if (-not (Test-Path $FilePath)) {
    Write-Host "File not found: $FilePath" -ForegroundColor Red
    exit 1
}

# Get file info
$fileInfo = Get-Item $FilePath
$fileName = $fileInfo.Name
$fileExtension = $fileInfo.Extension.ToLower()

# Determine content type based on extension
$contentType = switch ($fileExtension) {
    ".txt" { "text/plain" }
    ".pdf" { "application/pdf" }
    ".jpg" { "image/jpeg" }
    ".jpeg" { "image/jpeg" }
    ".png" { "image/png" }
    ".docx" { "application/vnd.openxmlformats-officedocument.wordprocessingml.document" }
    ".doc" { "application/msword" }
    ".pptx" { "application/vnd.openxmlformats-officedocument.presentationml.presentation" }
    ".ppt" { "application/vnd.ms-powerpoint" }
    default { "application/octet-stream" }
}

Write-Host "Testing upload for: $fileName ($contentType)" -ForegroundColor Yellow

# Create form data using Add-Type for better multipart handling
Add-Type -AssemblyName System.Net.Http

$httpClientHandler = New-Object System.Net.Http.HttpClientHandler
$httpClient = New-Object System.Net.Http.HttpClient($httpClientHandler)

try {
    $multipartFormContent = New-Object System.Net.Http.MultipartFormDataContent
    
    # Read file as bytes
    $fileBytes = [System.IO.File]::ReadAllBytes($FilePath)
    $fileContent = New-Object System.Net.Http.ByteArrayContent -ArgumentList (,$fileBytes)
    $fileContent.Headers.ContentType = [System.Net.Http.Headers.MediaTypeHeaderValue]::Parse($contentType)
    
    $multipartFormContent.Add($fileContent, "file", $fileName)
    
    $response = $httpClient.PostAsync($uri, $multipartFormContent).Result
    $responseContent = $response.Content.ReadAsStringAsync().Result
    
    if ($response.IsSuccessStatusCode) {
        Write-Host "✅ Success!" -ForegroundColor Green
        Write-Host "Response: $responseContent" -ForegroundColor Green
    } else {
        Write-Host "❌ Error: $($response.StatusCode)" -ForegroundColor Red
        Write-Host "Response: $responseContent" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Exception: $($_.Exception.Message)" -ForegroundColor Red
} finally {
    $httpClient.Dispose()
}