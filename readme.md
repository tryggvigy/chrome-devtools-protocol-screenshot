This tool reads instructions from stdin or args and captures screenshots
using the chrome devtools protocol from a running blink-based
browser instance at various given breakpoints.

#### Stdin
If you have a `inst.json` like the following (you can use any uri, for example http://example.com)
```json
{
  "uris": {
    "spotify:album:6LBiuhK7PZKjVXyMfPxPoh": {
      "breakPoints": [1200, 800, 400]
    },
    "spotify:artist:7xUZ4069zcyBM4Bn10NQ1c": {
      "breakPoints": [1200, 600]
    }
  }
}
```

then

```
cat inst.json | chrome-devtools-protocol-screenshot --outputDir ./captures --remoteDebuggingPort 9222
```
will output screenshots of these uris at these widths to the output directory.

#### args
```
chrome-devtools-protocol-screenshot --outputDir ./captures --remoteDebuggingPort 9222 --breakPoints 1200,800
```
Will create screenshots at 1200 width and 800 width of the current page 
in the chromium app and output them to ./captures.

## Comparison

You can use whatever image comparison tool you like.
I like to use ImageMagik.

```
convert '(' img1.png ')' \
        '(' img2.png ')' \
        '(' -clone 0-1 -compose darken -composite ')' \
        -channel RGB -combine diff.png
```
Generates:
![](https://i.imgur.com/RqAOcdW.png)

```
compare foo_prod.png foo_dev.png diff.png
```
Generates:
![](https://i.imgur.com/eeyo050.png)
