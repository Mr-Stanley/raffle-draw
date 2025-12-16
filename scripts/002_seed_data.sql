-- Insert a sample raffle
insert into public.raffles (id, title, description, status, draw_date)
values (
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'Weekly Prize Draw',
  'Win exciting prizes including lunch vouchers, data bundles, airtime, and cash tokens!',
  'upcoming',
  now() + interval '7 days'
) on conflict do nothing;

-- Insert sample prizes for the raffle
insert into public.prizes (raffle_id, name, type, value, quantity, remaining)
values
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Lunch Voucher - N5000', 'lunch_voucher', 5000, 5, 5),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '10GB Data Bundle', 'data_voucher', 10, 10, 10),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'N2000 Airtime', 'airtime', 2000, 15, 15),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'N1000 Cash Token', 'cash_token', 1000, 20, 20)
on conflict do nothing;

-- Insert sample participants (for demonstration)
insert into public.participants (raffle_id, name, email, phone, entry_code)
values
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Chidi Okafor', 'chidi@example.com', '+2348012345678', 'RAFFLE-001'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Amina Bello', 'amina@example.com', '+2348023456789', 'RAFFLE-002'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Tunde Williams', 'tunde@example.com', '+2348034567890', 'RAFFLE-003'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Ngozi Eze', 'ngozi@example.com', '+2348045678901', 'RAFFLE-004'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Yusuf Ahmed', 'yusuf@example.com', '+2348056789012', 'RAFFLE-005')
on conflict (entry_code) do nothing;
