-- Add an explicit data kind to the existing source-preserved consignment
-- template. Frozen agreement versions retain their own rendered content and
-- document hash, so this metadata-only change does not alter executed records.
UPDATE public.agreement_templates
SET template_definition = jsonb_set(
  template_definition,
  '{data_kind}',
  '"vehicle_consignment"'::jsonb,
  true
)
WHERE template_key = 'vehicle_consignment_management'
  AND version = 1
  AND NOT (template_definition ? 'data_kind');

-- Canonical source: Google Doc "Rent With Heldy - Long-Term Vehicle Rental
-- Agreement" (Drive file 1a_qMhLU93FjaDgGC0zi0_sF1A5BCjPmI2RpLES9xLzE).
-- Legal prose is represented as immutable template blocks; blank lines in the
-- source become typed editable fields in the HTML agreement editor.
INSERT INTO public.agreement_templates (
  template_key, name, version, status, template_definition
) VALUES (
  'long_term_vehicle_rental',
  'Long-Term Vehicle Rental Agreement',
  1,
  'active',
  $template$
  {
    "schema_version": 2,
    "agreement_code": "LTR",
    "data_kind": "long_term_rental",
    "sections": [
      {"number": 1, "title": "Renter Information", "blocks": [
        {"type": "renter_information"}
      ]},
      {"number": 2, "title": "Vehicle Information", "blocks": [
        {"type": "vehicle_information"}
      ]},
      {"number": 3, "title": "Rental Term", "blocks": [
        {"type": "rental_term"},
        {"type": "paragraph", "text": "If the parties agree that the rental will continue on a month-to-month basis after the initial term, the Agreement will automatically continue until terminated by either party in accordance with this Agreement."},
        {"type": "paragraph", "text": "The Vehicle must be returned by the agreed return date and time unless Rent With Heldy approves an extension."}
      ]},
      {"number": 4, "title": "Rental Rate", "blocks": [
        {"type": "rental_rate"},
        {"type": "paragraph", "text": "The monthly rate is the agreed monthly rental price and is not necessarily calculated by multiplying the weekly rate by four."},
        {"type": "paragraph", "text": "Renter agrees to make all payments when due. Failure to make a required payment may result in termination of this Agreement and a demand for immediate return of the Vehicle. Any extension of the rental period must be approved by Rent With Heldy."}
      ]},
      {"number": 5, "title": "Insurance Coverage", "blocks": [
        {"type": "paragraph", "text": "Renter must maintain valid automobile insurance applicable to the Vehicle for the entire rental period unless Rent With Heldy has expressly arranged or approved alternative coverage in writing."},
        {"type": "insurance"},
        {"type": "paragraph", "text": "Renter agrees to provide proof of insurance before taking possession of the Vehicle and whenever reasonably requested during the rental period. Renter is responsible for ensuring that the insurance policy actually permits and covers the Renter’s use of the rented Vehicle. Providing an insurance card does not constitute a representation by Rent With Heldy that the policy provides sufficient coverage."},
        {"type": "subheading", "text": "Primary Insurance Notice"},
        {"type": "paragraph", "text": "THE VALID AND COLLECTIBLE LIABILITY INSURANCE AND PERSONAL INJURY PROTECTION INSURANCE OF ANY AUTHORIZED RENTAL OR LEASING DRIVER IS PRIMARY FOR THE LIMITS OF LIABILITY AND PERSONAL INJURY PROTECTION COVERAGE REQUIRED BY SS. 324.021(7) AND 627.736, FLORIDA STATUTES."}
      ]},
      {"number": 6, "title": "Responsibility for the Vehicle", "blocks": [
        {"type": "paragraph", "text": "Renter accepts responsibility for the Vehicle while it is in Renter’s possession or control. Renter agrees to:"},
        {"type": "bullet_list", "items": [
          "Operate the Vehicle safely and lawfully.",
          "Keep the Vehicle reasonably clean and properly maintained.",
          "Notify Rent With Heldy promptly of warning lights, mechanical problems, accidents, theft, or damage.",
          "Not intentionally damage, abuse, neglect, abandon, or misuse the Vehicle.",
          "Return the Vehicle in substantially the same condition in which it was received, ordinary wear and tear excepted.",
          "Follow reasonable maintenance and operating instructions provided by Rent With Heldy."
        ]},
        {"type": "paragraph", "text": "Renter is financially responsible, to the extent permitted by applicable law and subject to applicable insurance coverage, for loss or damage occurring during the rental period that results from collision, theft, vandalism, misuse, negligence, unauthorized use, or violation of this Agreement."}
      ]},
      {"number": 7, "title": "Accidents, Damage, and Theft", "blocks": [
        {"type": "paragraph", "text": "If the Vehicle is involved in an accident, damaged, vandalized, stolen, or otherwise lost, Renter must notify Rent With Heldy as soon as reasonably possible."},
        {"type": "paragraph", "text": "Renter must cooperate with Rent With Heldy, law enforcement, insurance companies, and claims administrators in investigating and processing any claim. Renter may not authorize repairs to the Vehicle without prior approval from Rent With Heldy except when reasonably necessary to prevent immediate additional damage or address an emergency."},
        {"type": "paragraph", "text": "Renter remains responsible for amounts not paid by applicable insurance when such amounts are legally the Renter’s responsibility, including applicable deductibles and damage resulting from excluded or unauthorized use."}
      ]},
      {"number": 8, "title": "Authorized Drivers", "blocks": [
        {"type": "paragraph", "text": "Only the Renter and any additional driver expressly approved by Rent With Heldy may operate the Vehicle."},
        {"type": "authorized_driver"},
        {"type": "paragraph", "text": "Allowing an unauthorized person to operate the Vehicle constitutes a violation of this Agreement."}
      ]},
      {"number": 9, "title": "Prohibited Use", "blocks": [
        {"type": "paragraph", "text": "The Vehicle may not be:"},
        {"type": "bullet_list", "items": [
          "Used for any illegal activity.",
          "Operated by an unlicensed or unauthorized driver.",
          "Driven while the driver is impaired by alcohol, drugs, or any substance affecting safe operation.",
          "Used for racing, speed testing, towing, pushing another vehicle, or other abusive use unless specifically authorized.",
          "Intentionally taken outside the geographic area permitted by Rent With Heldy.",
          "Subleased, rented, loaned, or transferred to another person without written permission.",
          "Used in a manner prohibited by applicable insurance coverage."
        ]},
        {"type": "rideshare_use"}
      ]},
      {"number": 10, "title": "Tolls, Tickets, and Other Charges", "blocks": [
        {"type": "paragraph", "text": "Renter is responsible for tolls, parking charges, traffic citations, towing charges, impound fees, and other charges resulting from Renter’s possession or use of the Vehicle during the rental period."},
        {"type": "paragraph", "text": "If Rent With Heldy pays such a charge on Renter’s behalf, Renter agrees to reimburse Rent With Heldy for the amount paid plus any reasonable administrative fee disclosed to the Renter."}
      ]},
      {"number": 11, "title": "Maintenance", "blocks": [
        {"type": "paragraph", "text": "Renter must reasonably monitor the Vehicle during the rental period, including tires, warning lights, fluid levels, and other obvious maintenance conditions. Renter must promptly notify Rent With Heldy if the Vehicle requires service or develops a mechanical problem. Renter may not perform or authorize significant repairs or modifications without Rent With Heldy’s approval."},
        {"type": "paragraph", "text": "Unless separately agreed in writing:"},
        {"type": "maintenance_responsibilities"}
      ]},
      {"number": 12, "title": "Return of Vehicle", "blocks": [
        {"type": "paragraph", "text": "At the end of the rental period or upon lawful termination of this Agreement, Renter must return the Vehicle to Rent With Heldy at the agreed location, together with all keys, accessories, documents, and equipment provided with the Vehicle."},
        {"type": "return_location"},
        {"type": "paragraph", "text": "The Vehicle should be returned in substantially the same condition as received, ordinary wear and tear excepted."}
      ]},
      {"number": 13, "title": "Early Termination / Failure to Return", "blocks": [
        {"type": "paragraph", "text": "Rent With Heldy may terminate this Agreement and demand return of the Vehicle if Renter materially breaches this Agreement, including failure to pay amounts when due, loss of required insurance coverage, unauthorized use, fraudulent information, or unlawful use of the Vehicle."},
        {"type": "paragraph", "text": "Renter must promptly return the Vehicle following a lawful demand for return. Continued possession of the Vehicle after the rental period expires or after lawful termination does not create ownership rights or an automatic extension of this Agreement."}
      ]},
      {"number": 14, "title": "No Ownership Interest", "blocks": [
        {"type": "paragraph", "text": "This Agreement is for the temporary rental of the Vehicle only. Renter does not acquire any ownership, equity, purchase option, or other ownership interest in the Vehicle by making rental payments unless the parties execute a separate written agreement expressly providing otherwise."}
      ]},
      {"number": 15, "title": "Indemnification", "blocks": [
        {"type": "paragraph", "text": "To the extent permitted by Florida law, Renter agrees to be responsible for claims, losses, damages, fines, costs, and expenses resulting from Renter’s negligent, unlawful, unauthorized, or prohibited operation or possession of the Vehicle."},
        {"type": "paragraph", "text": "Nothing in this Agreement is intended to waive or limit any right, obligation, or liability that cannot legally be waived or limited under applicable law."}
      ]},
      {"number": 16, "title": "Personal Property", "blocks": [
        {"type": "paragraph", "text": "Rent With Heldy is not responsible for personal property left in or around the Vehicle except to the extent required by applicable law. Renter is responsible for removing all personal property when the Vehicle is returned."}
      ]},
      {"number": 17, "title": "Entire Agreement", "blocks": [
        {"type": "paragraph", "text": "This Agreement, together with any vehicle condition report, insurance documentation, payment authorization, addendum, or other document signed by the parties, constitutes the agreement between Rent With Heldy and Renter concerning this rental."},
        {"type": "paragraph", "text": "Changes to this Agreement must be agreed to in writing. If any provision of this Agreement is found unenforceable, the remaining provisions will remain in effect to the extent permitted by law. This Agreement is governed by the laws of the State of Florida."}
      ]},
      {"number": 18, "title": "Renter Acknowledgment", "blocks": [
        {"type": "paragraph", "text": "By signing below, Renter acknowledges that:"},
        {"type": "bullet_list", "items": [
          "Renter has reviewed the Vehicle and accepts possession of it.",
          "The information provided by Renter is accurate.",
          "Renter has received or will receive a copy of this Agreement.",
          "Renter understands the rental rate and rental term.",
          "Renter understands the insurance requirements.",
          "Renter understands their responsibilities concerning the Vehicle.",
          "Renter agrees to promptly report accidents, theft, damage, or mechanical problems.",
          "Renter agrees to return the Vehicle according to this Agreement.",
          "Renter has read and agrees to the terms of this Agreement."
        ]},
        {"type": "subheading", "text": "Signatures"},
        {"type": "signatures"},
        {"type": "subheading", "text": "Vehicle Condition at Delivery"},
        {"type": "vehicle_condition"},
        {"type": "subheading", "text": "Renter Vehicle Acceptance"},
        {"type": "paragraph", "text": "I acknowledge that I received the Vehicle in the condition documented above."}
      ]}
    ]
  }
  $template$::jsonb
)
ON CONFLICT (template_key, version) DO NOTHING;
