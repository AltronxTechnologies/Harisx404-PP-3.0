BEGIN;

DELETE FROM public.certifications WHERE is_demo = TRUE;

INSERT INTO public.certifications (
  title, issuer, issue_date, credential_url, display_order, status,
  issuer_logo_url, badge_image_url, credential_id, expiration_date,
  does_not_expire, description, skills, category, is_demo
)
VALUES
  ('CS50''s Introduction to Programming with Python', 'Harvard University', '2026-08-01', 'https://cs50.harvard.edu/certificates/09de786b-0b5e-445b-a3bb-e672b623b3ea', 10, 'published', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/c/cc/Harvard_University_coat_of_arms.svg/1280px-Harvard_University_coat_of_arms.svg.png?utm_source=en.wikipedia.org', NULL, NULL, NULL, TRUE, 'Completed Harvard CS50P, covering Python fundamentals, functions, object-oriented programming, file handling, regular expressions, APIs, exceptions, and automated testing with pytest.', ARRAY['Python', 'Software Development', 'OOP', 'File Handling', 'Regular Expressions', 'APIs', 'Exception Handling', 'Pytest', 'CLI Development', 'Cybersecurity'], 'Web Development', FALSE),
  ('Introduction to Cybersecurity', 'Cisco', '2026-06-01', 'https://www.credly.com/badges/660327f0-5dc5-48d1-95e7-e4375d1d3f14/linked_in_profile', 20, 'published', 'https://cdn.simpleicons.org/cisco/049FD9', NULL, '660327f0-5dc5-48d1-95e7-e4375d1d3f14', NULL, TRUE, 'Official Cisco credential validating foundational knowledge of cyber threats, network vulnerabilities, security best practices, and data confidentiality.', ARRAY['Cybersecurity', 'Threat Detection', 'Network Security', 'Vulnerability Analysis', 'Data Privacy'], 'Cybersecurity', FALSE),
  ('AI Skills Fest 2026', 'Microsoft', '2026-06-01', 'https://www.credly.com/badges/b21bab8d-85e4-4363-b176-74d4330992e3/linked_in_profile', 30, 'published', 'https://www.microsoft.com/favicon.ico', NULL, NULL, NULL, TRUE, 'Microsoft credential covering foundational and applied AI knowledge, responsible use, productivity workflows, content creation, and real-world problem solving.', ARRAY['AI Ethics', 'AI Literacy', 'AI Tools', 'Applied AI', 'Build Automation', 'Prompt Engineering', 'Responsible AI', 'Workflow Automation'], 'AI / ML', FALSE),
  ('Delta 2.0: Full Stack Web Development', 'Apna College', '2023-11-01', NULL, 40, 'published', 'https://lwfiles.mycourse.app/62a6cd5e1e9e2fbf212d608d-public/0f275b1c30123c908cc8491a86d9146a.png', NULL, NULL, NULL, TRUE, 'Comprehensive full-stack engineering program covering modern frontend development, backend APIs, databases, version control, and deployment with the MERN ecosystem.', ARRAY['Full-Stack Development', 'Web Development', 'HTML5', 'CSS3', 'JavaScript', 'React', 'Node.js', 'Express', 'REST APIs', 'MongoDB', 'SQL', 'Git'], 'Web Development', FALSE),
  ('Master Computer Networking', 'Scaler', '2025-09-01', 'https://moonshot.scaler.com/s/li/Q8CqwmLi0Q', 50, 'published', 'https://www.scaler.com/favicon.ico', NULL, NULL, NULL, TRUE, 'Completed Scaler''s computer networking course with practical coverage of network architecture, protocols, addressing, DNS, DHCP, HTTP, and TCP/IP.', ARRAY['Computer Networking', 'Network Protocols', 'TCP/IP', 'DNS', 'DHCP', 'HTTP', 'IP Addressing'], 'Cybersecurity', FALSE)
ON CONFLICT (issuer, title) DO UPDATE SET
  issue_date = EXCLUDED.issue_date,
  credential_url = EXCLUDED.credential_url,
  display_order = EXCLUDED.display_order,
  status = EXCLUDED.status,
  issuer_logo_url = EXCLUDED.issuer_logo_url,
  badge_image_url = EXCLUDED.badge_image_url,
  credential_id = EXCLUDED.credential_id,
  expiration_date = EXCLUDED.expiration_date,
  does_not_expire = EXCLUDED.does_not_expire,
  description = EXCLUDED.description,
  skills = EXCLUDED.skills,
  category = EXCLUDED.category,
  is_demo = EXCLUDED.is_demo;

COMMIT;
