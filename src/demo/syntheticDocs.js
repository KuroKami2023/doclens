// Synthetic demo corpus — clearly fake data for the dashboard/analytics demo.
// NEVER mixed with real extractions: rows created from this file are tagged
// demo-synthetic in model/engine fields. All names/numbers are invented for
// illustration, which is fine because they are labeled demo, not presented
// as AI output on a real user document.

export const SYNTHETIC_DOCS = [
  {
    docType: 'invoice',
    ocrConfidence: 96.4,
    processingTimeMs: 8400,
    ocrText: `ACME SUPPLY CO.\n123 Market Street, Springfield\nINVOICE #INV-2026-0417\nBill to: Globex Corp\nIssue: 2026-08-12  Due: 2026-09-11\nWidget A x10 @ 25.00 = 250.00\nGadget B x5 @ 40.00 = 200.00\nSubtotal 450.00  Tax 36.00  TOTAL 486.00 USD\nTerms: Net 30`,
    extraction: {
      overall_confidence: 93.2,
      fields: {
        invoice_number: 'INV-2026-0417',
        vendor_name: 'Acme Supply Co.',
        vendor_address: '123 Market Street, Springfield',
        customer_name: 'Globex Corp',
        issue_date: '2026-08-12',
        due_date: '2026-09-11',
        currency: 'USD',
        subtotal: 450.0,
        tax_amount: 36.0,
        total_amount: 486.0,
        line_items: [
          { description: 'Widget A', quantity: 10, unit_price: 25.0, amount: 250.0 },
          { description: 'Gadget B', quantity: 5, unit_price: 40.0, amount: 200.0 },
        ],
        payment_terms: 'Net 30',
        notes: null,
      },
      field_confidence: {
        invoice_number: 98, vendor_name: 97, vendor_address: 90, customer_name: 95,
        issue_date: 96, due_date: 96, currency: 99, subtotal: 97, tax_amount: 95,
        total_amount: 98, line_items: 92, payment_terms: 88, notes: 0,
      },
    },
  },
  {
    docType: 'receipt',
    ocrConfidence: 91.8,
    processingTimeMs: 5200,
    ocrText: `SUNNY CAFE\n44 Harbor Rd\nReceipt #RC-88121  2026-07-02 14:22\nLatte 4.50\nCroissant 3.25\nSubtotal 7.75  Tax 0.62  TOTAL 8.37 USD\nPaid: Visa ****1234`,
    extraction: {
      overall_confidence: 90.1,
      fields: {
        merchant_name: 'Sunny Cafe',
        merchant_address: '44 Harbor Rd',
        receipt_number: 'RC-88121',
        transaction_date: '2026-07-02',
        currency: 'USD',
        subtotal: 7.75,
        tax_amount: 0.62,
        total_amount: 8.37,
        payment_method: 'Visa ****1234',
        line_items: [
          { description: 'Latte', quantity: 1, unit_price: 4.5, amount: 4.5 },
          { description: 'Croissant', quantity: 1, unit_price: 3.25, amount: 3.25 },
        ],
        notes: null,
      },
      field_confidence: {
        merchant_name: 96, merchant_address: 88, receipt_number: 94, transaction_date: 93,
        currency: 99, subtotal: 92, tax_amount: 90, total_amount: 95, payment_method: 85,
        line_items: 89, notes: 0,
      },
    },
  },
  {
    docType: 'purchase_order',
    ocrConfidence: 94.2,
    processingTimeMs: 7100,
    ocrText: `PURCHASE ORDER PO-2026-0931\nBuyer: Initech LLC  Supplier: Acme Supply Co.\nOrder: 2026-06-20  Delivery: 2026-07-05\n500x Resistor Kit @ 0.80 = 400.00\nSubtotal 400.00 Tax 32.00 TOTAL 432.00 USD\nShip to: 500 Tech Park, Austin`,
    extraction: {
      overall_confidence: 91.5,
      fields: {
        po_number: 'PO-2026-0931',
        buyer_name: 'Initech LLC',
        supplier_name: 'Acme Supply Co.',
        order_date: '2026-06-20',
        delivery_date: '2026-07-05',
        currency: 'USD',
        subtotal: 400.0,
        tax_amount: 32.0,
        total_amount: 432.0,
        line_items: [{ description: 'Resistor Kit', quantity: 500, unit_price: 0.8, amount: 400.0 }],
        delivery_address: '500 Tech Park, Austin',
        notes: null,
      },
      field_confidence: {
        po_number: 97, buyer_name: 94, supplier_name: 95, order_date: 93, delivery_date: 92,
        currency: 99, subtotal: 94, tax_amount: 90, total_amount: 95, line_items: 90,
        delivery_address: 87, notes: 0,
      },
    },
  },
  {
    docType: 'resume',
    ocrConfidence: 97.1,
    processingTimeMs: 6800,
    ocrText: `JANE DOE\njane.doe@example.com | 555-0102 | Springfield\nSUMMARY: Frontend engineer, 5y React.\nSKILLS: JavaScript, React, Vite, Tailwind\nEXPERIENCE: UI Engineer @ Globex (2022-2026); Web Dev @ Initech (2020-2022)\nEDUCATION: B.S. Computer Science, State Univ (2020)`,
    extraction: {
      overall_confidence: 89.4,
      fields: {
        full_name: 'Jane Doe',
        email: 'jane.doe@example.com',
        phone: '555-0102',
        location: 'Springfield',
        summary: 'Frontend engineer, 5y React.',
        skills: ['JavaScript', 'React', 'Vite', 'Tailwind'],
        experience: [
          { title: 'UI Engineer', company: 'Globex', dates: '2022-2026' },
          { title: 'Web Dev', company: 'Initech', dates: '2020-2022' },
        ],
        education: [{ degree: 'B.S. Computer Science', school: 'State Univ', year: '2020' }],
        links: null,
        notes: null,
      },
      field_confidence: {
        full_name: 98, email: 99, phone: 95, location: 90, summary: 85, skills: 92,
        experience: 88, education: 87, links: 0, notes: 0,
      },
    },
  },
  {
    docType: 'contract',
    ocrConfidence: 89.5,
    processingTimeMs: 9100,
    ocrText: `SERVICES AGREEMENT\nBetween Globex Corp (Party A) and Acme Supply Co. (Party B)\nEffective 2026-01-15 to 2027-01-14\nGoverning law: State of Springfield\nValue: 120000 USD\nClause 4: Net-30 payment. Clause 9: 90-day termination notice.`,
    extraction: {
      overall_confidence: 84.7,
      fields: {
        contract_title: 'Services Agreement',
        party_a: 'Globex Corp',
        party_b: 'Acme Supply Co.',
        effective_date: '2026-01-15',
        expiry_date: '2027-01-14',
        governing_law: 'State of Springfield',
        total_value: 120000,
        currency: 'USD',
        key_clauses: ['Net-30 payment', '90-day termination notice'],
        signatures: null,
        notes: null,
      },
      field_confidence: {
        contract_title: 92, party_a: 94, party_b: 94, effective_date: 90, expiry_date: 90,
        governing_law: 82, total_value: 88, currency: 95, key_clauses: 80, signatures: 0, notes: 0,
      },
    },
  },
  {
    docType: 'general',
    ocrConfidence: 93.0,
    processingTimeMs: 4700,
    ocrText: `FIELD TRIP NOTICE\nSpringfield Elementary — Grade 4 museum visit on 2026-10-03.\nBring lunch. Contact: Mr. Smith (555-0199).`,
    extraction: {
      overall_confidence: 82.3,
      fields: {
        title: 'Field Trip Notice',
        author: null,
        date: '2026-10-03',
        language: 'en',
        summary: 'Grade 4 museum visit; bring lunch.',
        key_points: ['Grade 4 museum visit', 'Bring lunch', 'Contact Mr. Smith 555-0199'],
        entities: ['Springfield Elementary', 'Mr. Smith'],
        notes: null,
      },
      field_confidence: {
        title: 90, author: 0, date: 88, language: 95, summary: 84, key_points: 82,
        entities: 80, notes: 0,
      },
    },
  },
];
