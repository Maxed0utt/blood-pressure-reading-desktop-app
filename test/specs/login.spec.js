describe('Login functionality', () => {
  // Helper to ensure logged out state and navigate to login
  async function ensureLoggedOut() {
    await browser.execute(() => {
      localStorage.clear()
    })
    await browser.url('/')
    await browser.pause(1000)
  }

  // Helper to ensure logged out and navigate to signup
  async function goToSignup() {
    await browser.execute(() => {
      localStorage.clear()
    })
    await browser.url('/signup')
    await browser.pause(1000)
  }

  it('should login with valid credentials', async () => {
    // First create a user to login with
    await goToSignup()

    const timestamp = Date.now()
    const testEmail = `login${timestamp}@example.com`
    const testPassword = 'TestPassword123!'

    await $('#full-name').setValue('Login Test User')
    await $('#email-address').setValue(testEmail)
    await $('#verify-email-address').setValue(testEmail)
    await $('#password').setValue(testPassword)
    await $('#confirm-password').setValue(testPassword)
    await $('[type="submit"]').click()

    await browser.waitUntil(
      async () => (await browser.getUrl()).includes('/dashboard'),
      { timeout: 15000 }
    )

    // Now logout and login
    await ensureLoggedOut()

    await $('input[type="email"]').setValue(testEmail)
    await $('input[type="password"]').setValue(testPassword)
    await $('[type="submit"]').click()

    await browser.waitUntil(
      async () => (await browser.getUrl()).includes('/dashboard'),
      { timeout: 15000, timeoutMsg: 'Expected to be redirected to dashboard after login' }
    )

    const url = await browser.getUrl()
    expect(url).toContain('/dashboard')
  })

  it('should show error for invalid credentials', async () => {
    await ensureLoggedOut()

    await $('input[type="email"]').setValue('nonexistent@example.com')
    await $('input[type="password"]').setValue('WrongPassword123!')
    await $('[type="submit"]').click()

    await browser.pause(2000)
    const body = await $('body')
    await expect(body).toHaveTextContaining('Invalid')
  })

  it('should redirect authenticated users from login page to dashboard', async () => {
    // First create and login a user
    await goToSignup()

    const timestamp = Date.now()
    const testEmail = `redirect${timestamp}@example.com`
    const testPassword = 'TestPassword123!'

    await $('#full-name').setValue('Redirect Test User')
    await $('#email-address').setValue(testEmail)
    await $('#verify-email-address').setValue(testEmail)
    await $('#password').setValue(testPassword)
    await $('#confirm-password').setValue(testPassword)
    await $('[type="submit"]').click()

    await browser.waitUntil(
      async () => (await browser.getUrl()).includes('/dashboard'),
      { timeout: 15000 }
    )

    // Try to visit login page while authenticated (don't clear localStorage)
    await browser.url('/')

    // Should be redirected back to dashboard
    await browser.waitUntil(
      async () => (await browser.getUrl()).includes('/dashboard'),
      { timeout: 5000 }
    )
  })
})
