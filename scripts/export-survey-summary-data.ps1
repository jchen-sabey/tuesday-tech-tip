param(
  [string]$SourcePath = "C:\Users\jchen\Documents\AI Training Feedback_ What Should We Build Next_(1-45).xlsx",
  [string]$OutputPath = "js\survey-summary-data.js"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

Add-Type -AssemblyName System.IO.Compression.FileSystem

function Get-ColumnIndex([string]$Reference) {
  $letters = ($Reference -replace "[0-9]", "").ToUpperInvariant()
  $index = 0
  foreach ($letter in $letters.ToCharArray()) {
    $index = ($index * 26) + ([int][char]$letter - [int][char]"A" + 1)
  }
  return $index - 1
}

function Normalize-Text([object]$Value) {
  if ($null -eq $Value) {
    return ""
  }

  $text = [string]$Value
  $text = $text.Replace([char]160, " ")
  $text = $text.Replace([char]0x2018, "'").Replace([char]0x2019, "'")
  $text = $text.Replace([char]0x201C, '"').Replace([char]0x201D, '"')
  $text = $text.Replace([char]0x2013, "-").Replace([char]0x2014, "-")
  $text = ($text -replace "\s+", " ").Trim()

  if ($text -eq "ID") {
    return ""
  }

  return $text
}

function Split-Choices([object]$Value) {
  $text = Normalize-Text $Value
  if ($text -eq "") {
    return @()
  }

  return @(
    $text -split ";" |
      ForEach-Object { Normalize-Text $_ } |
      Where-Object { $_ -ne "" }
  )
}

function Read-XlsxRows([string]$Path) {
  $zip = [System.IO.Compression.ZipFile]::OpenRead($Path)
  try {
    $sharedStrings = @()
    $sharedEntry = $zip.GetEntry("xl/sharedStrings.xml")
    if ($null -ne $sharedEntry) {
      $reader = [System.IO.StreamReader]::new($sharedEntry.Open())
      [xml]$sharedXml = $reader.ReadToEnd()
      $reader.Close()

      $sharedNs = [System.Xml.XmlNamespaceManager]::new($sharedXml.NameTable)
      $sharedNs.AddNamespace("x", "http://schemas.openxmlformats.org/spreadsheetml/2006/main")

      foreach ($item in $sharedXml.SelectNodes("//x:si", $sharedNs)) {
        $sharedStrings += (($item.SelectNodes(".//x:t", $sharedNs) | ForEach-Object { $_.InnerText }) -join "")
      }
    }

    $sheetEntry = $zip.GetEntry("xl/worksheets/sheet1.xml")
    $reader = [System.IO.StreamReader]::new($sheetEntry.Open())
    [xml]$sheetXml = $reader.ReadToEnd()
    $reader.Close()

    $sheetNs = [System.Xml.XmlNamespaceManager]::new($sheetXml.NameTable)
    $sheetNs.AddNamespace("x", "http://schemas.openxmlformats.org/spreadsheetml/2006/main")

    $rawRows = @()
    foreach ($row in $sheetXml.SelectNodes("//x:sheetData/x:row", $sheetNs)) {
      $cells = @{}
      foreach ($cell in $row.SelectNodes("x:c", $sheetNs)) {
        $index = Get-ColumnIndex $cell.GetAttribute("r")
        $cellType = $cell.GetAttribute("t")
        $valueNode = $cell.SelectSingleNode("x:v", $sheetNs)
        $rawValue = if ($null -ne $valueNode) { $valueNode.InnerText } else { "" }

        if ($cellType -eq "s") {
          $value = $sharedStrings[[int]$rawValue]
        } elseif ($cellType -eq "inlineStr") {
          $value = (($cell.SelectNodes(".//x:t", $sheetNs) | ForEach-Object { $_.InnerText }) -join "")
        } else {
          $value = [string]$rawValue
        }
        $cells[$index] = $value
      }
      $rawRows += ,$cells
    }

    $headers = @{}
    foreach ($key in $rawRows[0].Keys) {
      $headers[[int]$key] = $rawRows[0][$key]
    }

    $records = @()
    for ($rowIndex = 1; $rowIndex -lt $rawRows.Count; $rowIndex++) {
      $record = @{}
      foreach ($columnIndex in ($headers.Keys | Sort-Object)) {
        $record[$columnIndex] = if ($rawRows[$rowIndex].ContainsKey($columnIndex)) { $rawRows[$rowIndex][$columnIndex] } else { "" }
      }
      $records += ,$record
    }

    return $records
  } finally {
    $zip.Dispose()
  }
}

$rows = Read-XlsxRows $SourcePath

$responses = @(
  foreach ($row in $rows) {
    [ordered]@{
      focus = @(Split-Choices $row[6])
      experience = Normalize-Text $row[7]
      challenges = @(Split-Choices $row[8])
      enhancements = @(Split-Choices $row[9])
      trainingInterest = Normalize-Text $row[11]
      resources = @(Split-Choices $row[12])
      outcomes = @(Split-Choices $row[13])
      advancedSkills = @(Split-Choices $row[14])
      previousTrainingValue = Normalize-Text $row[15]
      valueDrivers = @(Split-Choices $row[17])
      formats = @(Split-Choices $row[18])
      tools = @(Split-Choices $row[19])
    }
  }
)

$data = [ordered]@{
  responseCount = $responses.Count
  sourceName = [System.IO.Path]::GetFileName($SourcePath)
  generatedOn = (Get-Date -Format "yyyy-MM-dd")
  responses = $responses
  sections = @(
    [ordered]@{ key = "enhancements"; title = "Where AI Could Help"; question = "Which of the following best describe how AI could enhance the work you do today?"; type = "multi" }
    [ordered]@{ key = "challenges"; title = "Current Friction"; question = "What challenges have you encountered when using AI?"; type = "multi" }
    [ordered]@{ key = "trainingInterest"; title = "Training Readiness"; question = "What best describes your level and interest in more advanced AI training?"; type = "single" }
    [ordered]@{ key = "valueDrivers"; title = "What Would Make Training Valuable"; question = "What would make AI training more valuable for you?"; type = "multi" }
    [ordered]@{ key = "formats"; title = "Preferred Formats"; question = "What learning formats help you stay most engaged?"; type = "multi" }
    [ordered]@{ key = "advancedSkills"; title = "Advanced Skills"; question = "What advanced AI skills would you like to work on the most?"; type = "multi" }
    [ordered]@{ key = "outcomes"; title = "Advanced Training Outcomes"; question = "What are the main outcomes you would want from more advanced AI training?"; type = "multi" }
    [ordered]@{ key = "resources"; title = "Skill-Building Resources"; question = "Which resources would be most beneficial to help you build your AI skills?"; type = "multi" }
    [ordered]@{ key = "tools"; title = "Current Tool Access"; question = "Which AI tools do you currently use or have access to?"; type = "multi" }
    [ordered]@{ key = "experience"; title = "Current AI Experience"; question = "How would you describe your current experience with AI tools?"; type = "single" }
    [ordered]@{ key = "focus"; title = "Work Focus"; question = "Which best describes how you spend most of your time at work?"; type = "multi" }
    [ordered]@{ key = "previousTrainingValue"; title = "Previous Training Value"; question = "How valuable have previous AI trainings been for you?"; type = "single" }
  )
  recommendations = @(
    [ordered]@{
      title = "Role-Based Workflow Labs"
      summary = "Build training around real team workflows, not generic AI examples."
      evidence = @("20 respondents want role/team-specific training", "18 want sessions focused on real workflows")
      tags = @("highest pull", "training design")
    }
    [ordered]@{
      title = "Automation And Reporting Accelerator"
      summary = "Prioritize practical pilots for reporting, dashboards, recurring analysis, and multi-step process automation."
      evidence = @("24 selected data analysis/reporting", "24 selected process automation/workflow improvement", "16 want cross-tool AI workflows")
      tags = @("workflow", "pilot")
    }
    [ordered]@{
      title = "Reusable Prompt And Template Library"
      summary = "Create reusable prompt patterns, checklists, examples, and starter workflows that people can adapt."
      evidence = @("10 want reusable workflows/templates as an advanced outcome", "6 selected reusable templates/prompts as a resource")
      tags = @("enablement", "templates")
    }
    [ordered]@{
      title = "AI Quality, Privacy, And Trust Kit"
      summary = "Pair hands-on work with guidance for reviewing outputs, protecting data, and deciding when AI is reliable enough."
      evidence = @("17 cited output quality or accuracy concerns", "11 do not trust outputs enough to rely on them", "7 cited data privacy/security concerns")
      tags = @("governance", "confidence")
    }
    [ordered]@{
      title = "Short Practice Series"
      summary = "Offer guided workshops with short tips, recordings, and case studies so people can keep momentum."
      evidence = @("23 prefer hands-on workshops", "17 prefer short tips sessions", "15 prefer self-paced modules")
      tags = @("format", "cadence")
    }
  )
  textThemes = @(
    [ordered]@{ title = "Reporting, dashboards, and recurring analysis"; count = 6; examples = @("Weekly report organization", "KPI/status dashboards", "Safety metrics", "Budgeting and audit checks") }
    [ordered]@{ title = "Workflow automation across handoffs"; count = 4; examples = @("Sales-to-provisioning order flow", "Customer communications", "Operations center team support", "Delivery workflow visibility") }
    [ordered]@{ title = "Planning, scheduling, and risk spotting"; count = 4; examples = @("Schedule logic checks", "Project schedule changes", "Predictive operational adjustments", "Risk identification") }
    [ordered]@{ title = "Business writing and thought partnership"; count = 3; examples = @("Business cases", "Process improvement ideas", "Customer-facing communications") }
    [ordered]@{ title = "Trust and usefulness concerns"; count = 2; examples = @("Output reliability", "Concern that past trainings felt too basic or generic") }
  )
}

$json = $data | ConvertTo-Json -Depth 20
$content = "window.surveySummaryData = $json;`n"
$resolvedOutput = if ([System.IO.Path]::IsPathRooted($OutputPath)) { $OutputPath } else { Join-Path (Get-Location) $OutputPath }
$outputDirectory = Split-Path -Parent $resolvedOutput
if ($outputDirectory -and !(Test-Path -LiteralPath $outputDirectory)) {
  New-Item -ItemType Directory -Path $outputDirectory | Out-Null
}

Set-Content -LiteralPath $resolvedOutput -Value $content -Encoding UTF8
Write-Host "Wrote $resolvedOutput"
