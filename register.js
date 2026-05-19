// Register an external agent. Returns the new delegate object to merge into state.
export async function onRequestPost(context) {
  try {
    const body = await context.request.json();
    const { name, url, role, color } = body;

    if (!name || !url) {
      return Response.json({ error: 'name and url are required' }, { status: 400 });
    }

    let reachable = false;
    try {
      const ping = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ping: true }),
        signal: AbortSignal.timeout(5000)
      });
      reachable = ping.ok || ping.status < 500;
    } catch (_) {}

    const delegate = {
      id: `ext_${Math.random().toString(36).slice(2, 8)}`,
      name: name.substring(0, 40),
      role: (role || 'External Delegate').substring(0, 40),
      color: color || '#c084fc',
      model: 'external',
      url,
      registeredAt: Date.now(),
      reachable
    };

    return Response.json({
      delegate,
      warning: reachable ? null : 'Agent URL did not respond to ping — it will still be called during the convention.'
    });

  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
