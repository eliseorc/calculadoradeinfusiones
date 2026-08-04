(function () {
  const client = window.infusionSupabase;
  if (!client) return;

  const STATUS_LABELS = {
    pending: 'Pendiente',
    active: 'Activa',
    past_due: 'Pago pendiente',
    paused: 'Pausada',
    cancelled: 'Cancelada',
    expired: 'Vencida'
  };

  function formatPlan(plan) {
    if (!plan) return 'Gratuito';
    return plan.charAt(0).toUpperCase() + plan.slice(1);
  }

  function formatDate(value) {
    if (!value) return 'Sin renovación programada';
    return new Intl.DateTimeFormat('es-AR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    }).format(new Date(value));
  }

  function renderFreePlan(message) {
    document.getElementById('subscription-plan').textContent = 'Gratuito';
    document.getElementById('subscription-status').textContent = 'Sin suscripción';
    document.getElementById('subscription-status').dataset.status = 'free';
    document.getElementById('subscription-renewal').textContent = 'Sin renovación programada';
    document.getElementById('free-plan-action').hidden = false;
    document.getElementById('paid-plan-action').hidden = true;
    document.getElementById('early-access-note').hidden = false;
    if (message) document.getElementById('account-load-error').textContent = message;
  }

  function renderSubscription(subscription) {
    document.getElementById('subscription-plan').textContent = formatPlan(subscription.plan);
    document.getElementById('subscription-status').textContent = STATUS_LABELS[subscription.status] || subscription.status;
    document.getElementById('subscription-status').dataset.status = subscription.status;
    document.getElementById('subscription-renewal').textContent = formatDate(subscription.current_period_end);
    document.getElementById('free-plan-action').hidden = true;
    document.getElementById('paid-plan-action').hidden = false;
    document.getElementById('early-access-note').hidden = true;
  }

  async function initializeAccount() {
    const sessionResult = await client.auth.getSession();
    const user = sessionResult.data.session?.user;

    if (!user) {
      window.location.replace('acceso.html?modo=ingresar&return=cuenta.html');
      return;
    }

    document.getElementById('account-page-email').textContent = user.email || 'Cuenta activa';

    const subscriptionResult = await client
      .from('subscriptions')
      .select('plan,status,current_period_end,provider_subscription_id')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (subscriptionResult.error) {
      renderFreePlan('No pudimos consultar la suscripción. Mostramos el plan gratuito temporalmente.');
    } else if (subscriptionResult.data) {
      renderSubscription(subscriptionResult.data);
    } else {
      renderFreePlan('');
    }

    document.getElementById('subscription-card').setAttribute('aria-busy', 'false');
  }

  document.addEventListener('DOMContentLoaded', function () {
    initializeAccount().catch(function () {
      renderFreePlan('No pudimos cargar los datos de la cuenta. Intentá nuevamente.');
      document.getElementById('subscription-card').setAttribute('aria-busy', 'false');
    });

    document.getElementById('account-page-signout').addEventListener('click', async function () {
      await client.auth.signOut();
      window.location.replace('index.html');
    });
  });
})();
