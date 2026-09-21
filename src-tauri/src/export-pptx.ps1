param([Parameter(Mandatory=$true)][string]$Source,[Parameter(Mandatory=$true)][string]$Output,[long]$CacheBudget=268435456)
$ErrorActionPreference='Stop'
$app=$null;$deck=$null;$owned=$false;$security=$null
try {
 Add-Type -AssemblyName System.IO.Compression.FileSystem
 $zip=[IO.Compression.ZipFile]::OpenRead($Source)
 try {
  foreach($entry in $zip.Entries){
   if($entry.FullName -match 'vbaProject|oleObject') {throw '宏或嵌入对象不在本轮静态安全导出范围'}
   if($entry.FullName.EndsWith('.rels')){ $reader=[IO.StreamReader]::new($entry.Open());try{$xml=$reader.ReadToEnd()}finally{$reader.Dispose()};if($xml -match 'TargetMode\s*=\s*["'']External'){throw '检测到外部关系；未更新链接，已跳过此文件'} }
  }
 } finally {$zip.Dispose()}
 $existing=@(Get-Process POWERPNT -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Id)
 if($existing.Count -gt 0){throw 'BLOCKED: PowerPoint已有运行实例；为保护用户演示未调用COM。用户自行关闭后可刷新。'}
 # PowerPoint COM may reuse the user's process. Refuse before opening in that case.
 $creationStart=[DateTime]::UtcNow
 $app=New-Object -ComObject PowerPoint.Application
 $new=@(Get-Process POWERPNT -ErrorAction SilentlyContinue | Where-Object {$existing -notcontains $_.Id})
 if($new.Count -ne 1){throw 'BLOCKED: 无法确认独立PowerPoint进程归属；未打开源文件或退出用户实例。'}
 $officePid=$new[0].Id
 $processInfo=Get-CimInstance Win32_Process -Filter "ProcessId=$officePid"
 if($processInfo.CommandLine -notmatch '(?i)(?:-Embedding|/automation)' -or $new[0].StartTime.ToUniversalTime() -lt $creationStart.AddSeconds(-1) -or $app.Presentations.Count -ne 0){throw 'BLOCKED: 新PowerPoint实例归属不能充分确认，未打开源文件，未退出该进程。'}
 $owned=$true
 $process=Get-Process -Id $officePid
 @{pid=$officePid;commandLine=$processInfo.CommandLine;startTimeUtc=$process.StartTime.ToUniversalTime().ToString('o');source=$Source} | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $Output 'owned-process.json') -Encoding UTF8
 $security=$app.AutomationSecurity;$app.AutomationSecurity=3
 $app.DisplayAlerts=2 # ppAlertsAll: do not accept defaults for interactive warnings
 $deck=$app.Presentations.Open($Source,-1,0,0)
 $app.AutomationSecurity=$security
 if($deck.Slides.Count -lt 1 -or $deck.Slides.Count -gt 300){throw '页数必须在1至300内'}
 $width=[double]$deck.PageSetup.SlideWidth;$height=[double]$deck.PageSetup.SlideHeight
 $exportBytes=0
 $scale=1800/[Math]::Max($width,$height);$pages=@()
 for($i=1;$i -le $deck.Slides.Count;$i++){
  $slide=$deck.Slides.Item($i)
  try { $slide.Export((Join-Path $Output "page-$i.png"),'PNG',[int]($width*$scale),[int]($height*$scale));$exportBytes+=(Get-Item -LiteralPath (Join-Path $Output "page-$i.png")).Length;if($exportBytes -gt [Math]::Min(256MB,$CacheBudget)){throw '静态缓存超过本次剩余预算，结果不入库'};$pages+=@{number=$i;width=$width;height=$height;hidden=($slide.SlideShowTransition.Hidden -eq -1);asset=''} }
  finally {[void][Runtime.InteropServices.Marshal]::FinalReleaseComObject($slide)}
 }
 # Include hidden slides in original source order; each item records hidden and source number.
 [IO.File]::WriteAllText((Join-Path $Output 'pages.json'),(ConvertTo-Json -InputObject @($pages) -Depth 5),[Text.UTF8Encoding]::new($false))
} catch {
 [IO.File]::WriteAllText((Join-Path $Output 'error.txt'),$_.Exception.Message,[Text.UTF8Encoding]::new($false));exit 1
} finally {
 if($deck){try{$deck.Close()}catch{};[void][Runtime.InteropServices.Marshal]::FinalReleaseComObject($deck)}
 if($app){if($owned){try{if($null -ne $security){$app.AutomationSecurity=$security};$app.Quit()}catch{}};[void][Runtime.InteropServices.Marshal]::FinalReleaseComObject($app)}
 [GC]::Collect();[GC]::WaitForPendingFinalizers()
}


