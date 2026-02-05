describe('Signup flow', () => {
  // Helper to ensure logged out state
  async function ensureLoggedOut() {
    await browser.execute(() => {
      localStorage.clear()
    })
    await browser.url('/signup')
    await browser.pause(1000)
  }

  it('should sign up and be automatically logged in', async () => {
    await ensureLoggedOut()

    const timestamp = Date.now()
    const testEmail = `test${timestamp}@example.com`
    const testName = `Test User ${timestamp}`
    const testPassword = 'TestPassword123!'

    const nameField = await $('#full-name')
    await nameField.waitForExist({ timeout: 5000 })
    await nameField.setValue(testName)

    await $('#email-address').setValue(testEmail)
    await $('#verify-email-address').setValue(testEmail)
    await $('#password').setValue(testPassword)
    await $('#confirm-password').setValue(testPassword)

    await browser.pause(500)
    await $('[type="submit"]').click()

    await browser.waitUntil(
      async () => (await browser.getUrl()).includes('/dashboard'),
      { timeout: 15000, timeoutMsg: 'Expected to be redirected to dashboard after signup' }
    )

    const body = await $('body')
    await expect(body).toHaveTextContaining('Dashboard')
  })

  it('should show error for duplicate email', async () => {
    await ensureLoggedOut()

    // First, create a user
    const timestamp = Date.now()
    const testEmail = `duplicate${timestamp}@example.com`
    const testPassword = 'TestPassword123!'

    await $('#full-name').setValue('First User')
    await $('#email-address').setValue(testEmail)
    await $('#verify-email-address').setValue(testEmail)
    await $('#password').setValue(testPassword)
    await $('#confirm-password').setValue(testPassword)
    await browser.pause(500)
    await $('[type="submit"]').click()

    await browser.waitUntil(
      async () => (await browser.getUrl()).includes('/dashboard'),
      { timeout: 15000 }
    )

    // Now logout and try to sign up with same email
    await ensureLoggedOut()

    await $('#full-name').setValue('Duplicate User')
    await $('#email-address').setValue(testEmail)
    await $('#verify-email-address').setValue(testEmail)
    await $('#password').setValue(testPassword)
    await $('#confirm-password').setValue(testPassword)
    await browser.pause(500)
    await $('[type="submit"]').click()

    // Should show error about existing email
    await browser.pause(2000)
    const body = await $('body')
    await expect(body).toHaveTextContaining('already')
  })

  it('should validate email match', async () => {
    await ensureLoggedOut()

    await $('#full-name').setValue('Test User')
    await $('#email-address').setValue('test@example.com')
    await $('#verify-email-address').setValue('different@example.com')
    await $('#password').setValue('TestPassword123!')
    await $('#confirm-password').setValue('TestPassword123!')
    await browser.pause(500)
    await $('[type="submit"]').click()

    await browser.pause(1000)
    const body = await $('body')
    await expect(body).toHaveTextContaining('emails do not match')
  })

  it('should validate password match', async () => {
    await ensureLoggedOut()

    await $('#full-name').setValue('Test User')
    await $('#email-address').setValue('test@example.com')
    await $('#verify-email-address').setValue('test@example.com')
    await $('#password').setValue('TestPassword123!')
    await $('#confirm-password').setValue('DifferentPassword123!')
    await browser.pause(500)
    await $('[type="submit"]').click()

    await browser.pause(1000)
    const body = await $('body')
    await expect(body).toHaveTextContaining('passwords do not match')
  })
})
