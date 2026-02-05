describe('Debug tests', () => {
  it('should show page content', async () => {
    // Navigate to signup page
    await browser.url('/signup')

    // Wait a moment
    await browser.pause(3000)

    // Get current URL
    const url = await browser.getUrl()
    console.log('Current URL:', url)

    // Get page source/content
    const pageSource = await browser.getPageSource()
    console.log('Page source (first 2000 chars):', pageSource.substring(0, 2000))

    // Try to get body text
    try {
      const body = await $('body')
      const text = await body.getText()
      console.log('Body text:', text.substring(0, 1000))
    } catch (e) {
      console.log('Could not get body text:', e.message)
    }

    // Try to find any input elements
    const inputs = await $$('input')
    console.log('Number of input elements found:', inputs.length)

    // Try to find any elements at all
    const allDivs = await $$('div')
    console.log('Number of div elements found:', allDivs.length)
  })

  it('should navigate to root', async () => {
    // Navigate to root (login page)
    await browser.url('/')

    await browser.pause(3000)

    const url = await browser.getUrl()
    console.log('Current URL:', url)

    const pageSource = await browser.getPageSource()
    console.log('Page source (first 2000 chars):', pageSource.substring(0, 2000))

    const inputs = await $$('input')
    console.log('Number of input elements found:', inputs.length)
  })
})
