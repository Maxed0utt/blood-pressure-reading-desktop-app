describe('BP Reading CRUD operations', () => {
  before(async () => {
    // Create and login a user for all tests
    await browser.execute(() => {
      localStorage.clear()
    })
    await browser.url('/signup')
    await browser.pause(1000)

    const timestamp = Date.now()
    const testEmail = `crud${timestamp}@example.com`
    const testPassword = 'TestPassword123!'

    await $('#full-name').setValue('CRUD Test User')
    await $('#email-address').setValue(testEmail)
    await $('#verify-email-address').setValue(testEmail)
    await $('#password').setValue(testPassword)
    await $('#confirm-password').setValue(testPassword)
    await $('[type="submit"]').click()

    await browser.waitUntil(
      async () => (await browser.getUrl()).includes('/dashboard'),
      { timeout: 15000 }
    )
  })

  it('should navigate to readings list', async () => {
    await browser.url('/bpreading')

    const url = await browser.getUrl()
    expect(url).toContain('/bpreading')
  })

  it('should create a new BP reading', async () => {
    await browser.url('/bpreading/new')
    await browser.pause(500)

    await $('#topNumber').setValue('120')
    await $('#bottomNumber').setValue('80')
    await $('#heartRate').setValue('72')
    await $('[type="submit"]').click()

    await browser.waitUntil(
      async () => {
        const url = await browser.getUrl()
        return url.includes('/bpreading') && !url.includes('/new')
      },
      { timeout: 10000, timeoutMsg: 'Expected to be redirected to readings list after create' }
    )

    const body = await $('body')
    await expect(body).toHaveTextContaining('120')
    await expect(body).toHaveTextContaining('80')
  })

  it('should edit a BP reading', async () => {
    await browser.url('/bpreading')
    await browser.pause(500)

    const editButton = await $('[data-cy="edit-button"]')
    await editButton.waitForExist({ timeout: 5000 })
    await editButton.click()

    await browser.waitUntil(
      async () => (await browser.getUrl()).includes('/edit'),
      { timeout: 5000 }
    )

    await $('#topNumber').clearValue()
    await $('#topNumber').setValue('125')
    await $('#bottomNumber').clearValue()
    await $('#bottomNumber').setValue('85')
    await $('#heartRate').clearValue()
    await $('#heartRate').setValue('75')
    await $('[type="submit"]').click()

    await browser.waitUntil(
      async () => {
        const url = await browser.getUrl()
        return url.includes('/bpreading') && !url.includes('/edit')
      },
      { timeout: 10000 }
    )

    const body = await $('body')
    await expect(body).toHaveTextContaining('125')
    await expect(body).toHaveTextContaining('85')
  })

  it('should delete a BP reading', async () => {
    await browser.url('/bpreading')
    await browser.pause(500)

    // Get count of readings before delete
    const readingsBefore = await $$('table tbody tr')
    const countBefore = readingsBefore.length

    const deleteButton = await $('[data-cy="delete-button"]')
    await deleteButton.waitForExist({ timeout: 5000 })
    await deleteButton.click()

    // Confirm deletion in modal
    const confirmButton = await $('[data-cy="confirm-delete"]')
    await confirmButton.waitForExist({ timeout: 5000 })
    await confirmButton.click()

    await browser.pause(1000)

    // Verify reading was deleted
    const readingsAfter = await $$('table tbody tr')
    expect(readingsAfter.length).toBeLessThan(countBefore)
  })

  it('should have working export button', async () => {
    // First create a reading to export
    await browser.url('/bpreading/new')
    await browser.pause(500)

    await $('#topNumber').setValue('130')
    await $('#bottomNumber').setValue('90')
    await $('#heartRate').setValue('80')
    await $('[type="submit"]').click()

    await browser.waitUntil(
      async () => {
        const url = await browser.getUrl()
        return url.includes('/bpreading') && !url.includes('/new')
      },
      { timeout: 10000 }
    )

    // Check export button exists and is enabled
    const exportButton = await $('[data-cy="export-button"]')
    await exportButton.waitForExist({ timeout: 5000 })
    const isEnabled = await exportButton.isEnabled()
    expect(isEnabled).toBe(true)

    // Verify button text
    const buttonText = await exportButton.getText()
    expect(buttonText).toContain('Export')

    // Note: Full export test with file dialog requires manual testing
    // as it requires user interaction with the native save dialog
  })

  it('should import CSV readings', async () => {
    await browser.url('/bpreading')
    await browser.pause(500)

    // Count readings before import
    const readingsBefore = await $$('table tbody tr')
    const countBefore = readingsBefore.length

    // Create a CSV with new readings to import
    const csvToImport = `topNumber,bottomNumber,heartRate,createdAt
140,95,85,${Date.now() - 10000}
135,88,78,${Date.now() - 20000}`

    // Trigger import via the file input
    const importSuccess = await browser.execute(async (csv) => {
      return new Promise((resolve, reject) => {
        // Find the import input
        const input = document.querySelector('[data-cy="import-input"]')
        if (!input) {
          reject('Import input not found')
          return
        }

        // Create a File object from the CSV string
        const file = new File([csv], 'test-import.csv', { type: 'text/csv' })

        // Create a DataTransfer to set files
        const dataTransfer = new DataTransfer()
        dataTransfer.items.add(file)
        input.files = dataTransfer.files

        // Dispatch change event
        input.dispatchEvent(new Event('change', { bubbles: true }))

        // Wait for import to complete
        setTimeout(() => {
          const successMsg = document.querySelector('[data-cy="import-success"]')
          const errorMsg = document.querySelector('[data-cy="import-error"]')
          if (successMsg) {
            resolve({ success: true, message: successMsg.textContent })
          } else if (errorMsg) {
            resolve({ success: false, message: errorMsg.textContent })
          } else {
            resolve({ success: true, message: 'No feedback element found' })
          }
        }, 2000)
      })
    }, csvToImport)

    // Wait for the page to update
    await browser.pause(2000)

    // Verify readings were imported
    const readingsAfter = await $$('table tbody tr')
    expect(readingsAfter.length).toBeGreaterThan(countBefore)
  })
})
