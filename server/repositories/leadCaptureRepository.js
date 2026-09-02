import pool from "../config/db.js";

export const findLeadByMobileRepository = async (
  mobile
) => {

  const result = await pool.query(

    `
      SELECT *

      FROM leads

      WHERE mobile = $1

      AND is_deleted = FALSE;
    `,

    [mobile]

  );

  return result.rows[0];

};

export const findLeadByEmailRepository = async (
  email
) => {

  const result = await pool.query(

    `
      SELECT *

      FROM leads

      WHERE email = $1

      AND is_deleted = FALSE;
    `,

    [email]

  );

  return result.rows[0];

};

export const createPublicLeadRepository = async (
  client,
  lead
) => {
  const query = `
    INSERT INTO leads (
      lead_code,
      campaign_id,
      full_name,
      mobile,
      email,
      source,
      platform,
      interested_course,
      preferred_centre,
      utm_source,
      utm_medium,
      utm_campaign,
      utm_content,
      utm_term,
      external_lead_id,
      captured_at,
      status,
      priority
    )
    VALUES (
      $1,$2,$3,$4,$5,$6,$7,$8,$9,
      $10,$11,$12,$13,$14,$15,$16,
      $17,$18
    )
    RETURNING *;
  `;

  const values = [
    lead.lead_code,
    lead.campaign_id || null,
    lead.full_name,
    lead.mobile,
    lead.email || null,
    lead.source || "WEBSITE",
    lead.platform || lead.source || "WEBSITE",
    lead.interested_course || null,
    lead.preferred_centre || null,
    lead.utm_source || null,
    lead.utm_medium || null,
    lead.utm_campaign || null,
    lead.utm_content || null,
    lead.utm_term || null,
    lead.external_lead_id || null,
    lead.captured_at || new Date(),
    lead.status || "NEW",
    lead.priority || "LOW",
  ];

  const result = await client.query(query, values);
  return result.rows[0];
};

export const createLeadActivityRepository = async (
  client,
  activity
) => {
  try {
    const query = `
      INSERT INTO lead_activity_logs (
        lead_id,
        activity,
        description,
        performed_by
      )
      VALUES (
        $1,$2,$3,$4
      );
    `;

    await client.query(query, [
      activity.lead_id,
      activity.activity,
      activity.description,
      activity.performed_by || null,
    ]);
  } catch (err) {
    console.warn("Activity log notice:", err.message);
  }
};

export const updateExistingLeadRepository = async (
  client,
  id,
  lead
) => {
  const query = `
    UPDATE leads
    SET
      is_duplicate = TRUE,
      received_count = COALESCE(received_count, 1) + 1,
      last_received_at = CURRENT_TIMESTAMP,
      campaign_id = COALESCE($1, campaign_id),
      source = COALESCE($2, source),
      interested_course = COALESCE($3, interested_course),
      preferred_centre = COALESCE($4, preferred_centre),
      utm_source = $5,
      utm_medium = $6,
      utm_campaign = $7,
      utm_content = $8,
      utm_term = $9,
      external_lead_id = $10,
      captured_at = CURRENT_TIMESTAMP,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $11
    RETURNING *;
  `;

  const values = [
    lead.campaign_id || null,
    lead.source || null,
    lead.interested_course || null,
    lead.preferred_centre || null,
    lead.utm_source || null,
    lead.utm_medium || null,
    lead.utm_campaign || null,
    lead.utm_content || null,
    lead.utm_term || null,
    lead.external_lead_id || null,
    id,
  ];

  const result = await client.query(query, values);
  return result.rows[0];
};

export const findLeadByMobileOrEmailRepository = async (

  mobile,

  email

) => {

  const result = await pool.query(

    `

      SELECT *

      FROM leads

      WHERE

      (

        mobile = $1

        OR

        email = $2

      )

      AND is_deleted = FALSE

      LIMIT 1;

    `,

    [

      mobile,

      email

    ]

  );

  return result.rows[0];

};

export const getNextLeadCodeRepository = async (
  client
) => {

  const result = await client.query(`
    SELECT nextval('lead_code_seq') AS sequence;
  `);

  return result.rows[0].sequence;

};