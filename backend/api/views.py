from rest_framework import viewsets
from rest_framework.decorators import api_view
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Sum
from django.utils import timezone
from datetime import datetime, timedelta
from .models import User, Driver, Vehicle, Route, Ticket
from .serializers import UserSerializer, DriverSerializer, VehicleSerializer, RouteSerializer, TicketSerializer
from rest_framework.views import APIView

#viewsets
class CurrentUserView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer


class DriverViewSet(viewsets.ModelViewSet):
    queryset = Driver.objects.all()
    serializer_class = DriverSerializer


class RouteViewSet(viewsets.ModelViewSet):
    queryset = Route.objects.all()
    serializer_class = RouteSerializer


class VehicleViewSet(viewsets.ModelViewSet):
    queryset = Vehicle.objects.all()
    serializer_class = VehicleSerializer


class TicketViewSet(viewsets.ModelViewSet):
    queryset = Ticket.objects.all()
    serializer_class = TicketSerializer

    def perform_create(self, serializer):
        if self.request.user and self.request.user.is_authenticated:
            serializer.save(active_user=self.request.user)
        else:
            serializer.save()


# Batch 1 = 05:00–11:59 (PH time, UTC+8), Batch 2 = 12:00–23:59
def get_batch(ticket):
    local_hour = (ticket.issued_at + timedelta(hours=8)).hour
    return 'Batch 1' if 5 <= local_hour <= 15 else 'Batch 2'


def parse_date_start(date_str):
    # Returns UTC-aware datetime for start of day (PH time = UTC+8)
    d = datetime.strptime(date_str, '%Y-%m-%d')
    ph_start = datetime(d.year, d.month, d.day, 0, 0, 0)
    return timezone.make_aware(ph_start - timedelta(hours=8))


def parse_date_end(date_str):
    # Returns UTC-aware datetime for end of day (PH time = UTC+8)
    d = datetime.strptime(date_str, '%Y-%m-%d')
    ph_end = datetime(d.year, d.month, d.day, 23, 59, 59)
    return timezone.make_aware(ph_end - timedelta(hours=8))


def filter_collected(start_date=None, end_date=None):
    qs = Ticket.objects.filter(status='COLLECTED')
    if start_date:
        try:
            qs = qs.filter(issued_at__gte=parse_date_start(start_date))
        except ValueError:
            pass
    if end_date:
        try:
            qs = qs.filter(issued_at__lte=parse_date_end(end_date))
        except ValueError:
            pass
    return qs


def summarize(ticket_list):
    count = len(ticket_list)
    total = round(sum(float(t.collection_amount or 0) for t in ticket_list), 2)
    return {'count': count, 'total': total}


@api_view(['GET'])
def report_summary(request):
    start_date = request.query_params.get('start_date')
    end_date = request.query_params.get('end_date')

    tickets = list(filter_collected(start_date, end_date))

    now_ph = timezone.now() + timedelta(hours=8)
    today_utc_start = timezone.make_aware(datetime(now_ph.year, now_ph.month, now_ph.day, 0, 0, 0) - timedelta(hours=8))
    today_utc_end = timezone.make_aware(datetime(now_ph.year, now_ph.month, now_ph.day, 23, 59, 59) - timedelta(hours=8))

    batch1 = [t for t in tickets if get_batch(t) == 'Batch 1']
    batch2 = [t for t in tickets if get_batch(t) == 'Batch 2']
    today = [t for t in tickets if today_utc_start <= t.issued_at <= today_utc_end]

    return Response({
        'batch1': summarize(batch1),
        'batch2': summarize(batch2),
        'today': summarize(today),
        'grand_total': round(sum(float(t.collection_amount or 0) for t in tickets), 2),
        'total_tickets': len(tickets),
    })


@api_view(['GET'])
def report_collections(request):
    start_date = request.query_params.get('start_date')
    end_date = request.query_params.get('end_date')

    tickets = filter_collected(start_date, end_date).select_related('vehicle', 'driver', 'active_user').order_by('-issued_at')

    data = []
    for t in tickets:
        local_dt = t.issued_at + timedelta(hours=8)
        data.append({
            'id': t.id,
            'batch': get_batch(t),
            'issued_at': local_dt.strftime('%Y-%m-%d %H:%M'),
            'issued_date': local_dt.strftime('%Y-%m-%d'),
            'driver': t.driver.name if t.driver else '',
            'vehicle': t.vehicle.plate_number if t.vehicle else '',
            'route': t.route,
            'collection_amount': float(t.collection_amount or 0),
            'status': t.status,
        })

    return Response({'results': data, 'count': len(data)})


@api_view(['GET'])
def report_daily_chart(request):
    start_date = request.query_params.get('start_date')
    end_date = request.query_params.get('end_date')

    tickets = filter_collected(start_date, end_date)

    daily = {}
    for t in tickets:
        local_dt = t.issued_at + timedelta(hours=8)
        day_key = local_dt.strftime('%Y-%m-%d')
        batch = get_batch(t)
        if day_key not in daily:
            daily[day_key] = {'date': day_key, 'batch1_count': 0, 'batch1_total': 0.0, 'batch2_count': 0, 'batch2_total': 0.0}
        if batch == 'Batch 1':
            daily[day_key]['batch1_count'] += 1
            daily[day_key]['batch1_total'] += float(t.collection_amount or 0)
        else:
            daily[day_key]['batch2_count'] += 1
            daily[day_key]['batch2_total'] += float(t.collection_amount or 0)

    return Response({'chart_data': sorted(daily.values(), key=lambda x: x['date'])})


@api_view(['GET'])
def transaction_logs(request):
    show_all = request.query_params.get('all', 'false').lower() == 'true'

    tickets = Ticket.objects.select_related('vehicle', 'driver', 'active_user').order_by('-created_at')

    data = []
    for t in tickets:
        local_dt = t.created_at + timedelta(hours=8)
        data.append({
            'id': t.id,
            'action': t.status,
            'ticket_id': t.id,
            'driver': t.driver.name if t.driver else '',
            'vehicle': t.vehicle.plate_number if t.vehicle else '',
            'route': t.route,
            'amount': float(t.collection_amount or 0),
            'timestamp': local_dt.strftime('%Y-%m-%d %H:%M:%S'),
            'user': t.active_user.username if t.active_user else 'System',
            'batch': get_batch(t),
        })

    total = len(data)
    if not show_all:
        data = data[:10]

    return Response({'logs': data, 'total': total})


@api_view(['GET'])
def dashboard_stats(request):
    now_ph = timezone.now() + timedelta(hours=8)
    today_utc_start = timezone.make_aware(datetime(now_ph.year, now_ph.month, now_ph.day, 0, 0, 0) - timedelta(hours=8))

    all_collected = Ticket.objects.filter(status='COLLECTED')
    today_collected = list(all_collected.filter(issued_at__gte=today_utc_start))

    batch1_today = [t for t in today_collected if get_batch(t) == 'Batch 1']
    batch2_today = [t for t in today_collected if get_batch(t) == 'Batch 2']

    return Response({
        'batch1_today': summarize(batch1_today),
        'batch2_today': summarize(batch2_today),
        'today_total': summarize(today_collected),
        'total_tickets': Ticket.objects.count(),
        'total_collected': all_collected.count(),
        'total_revenue': round(float(all_collected.aggregate(s=Sum('collection_amount'))['s'] or 0), 2),
        'active_vehicles': Vehicle.objects.filter(is_archived=False).count(),
        'active_drivers': Driver.objects.filter(is_archived=False).count(),
    })


@api_view(['GET'])
def vehicle_records(request):
    """Fetch vehicle records with relational data: code, plate, route, and driver"""
    try:
        vehicles = Vehicle.objects.select_related('route', 'active_driver').order_by('code')
        print(f"DEBUG: Found {vehicles.count()} vehicles")
        
        data = []
        for v in vehicles:
            try:
                record = {
                    'id': v.id,
                    'code': v.code,
                    'plate_number': v.plate_number,
                    'route': v.route.full_name if v.route else '—',
                    'driver': v.active_driver.name if v.active_driver else '—',
                    'status': v.get_status_display() if hasattr(v, 'get_status_display') else v.status,
                }
                data.append(record)
                print(f"DEBUG: Added vehicle {record}")
            except Exception as e:
                print(f"DEBUG: Error processing vehicle {v.id}: {e}")
                continue

        print(f"DEBUG: Returning {len(data)} vehicles")
        return Response({'vehicles': data, 'total': len(data)})
    except Exception as e:
        print(f"DEBUG: Error in vehicle_records: {e}")
        return Response({'error': str(e), 'vehicles': [], 'total': 0}, status=500)


@api_view(['GET'])
def driver_records(request):
    """Fetch driver records with relational data: code, name, and contact number"""
    try:
        drivers = Driver.objects.order_by('code')
        print(f"DEBUG: Found {drivers.count()} drivers")

        data = []
        for d in drivers:
            try:
                record = {
                    'id': d.id,
                    'code': d.code,
                    'name': d.name,
                    'contact_number': d.contact_number if d.contact_number else '—',
                }
                data.append(record)
                print(f"DEBUG: Added driver {record}")
            except Exception as e:
                print(f"DEBUG: Error processing driver {d.id}: {e}")
                continue

        print(f"DEBUG: Returning {len(data)} drivers")
        return Response({'drivers': data, 'total': len(data)})
    except Exception as e:
        print(f"DEBUG: Error in driver_records: {e}")
        return Response({'error': str(e), 'drivers': [], 'total': 0}, status=500)


@api_view(['GET'])
def public_queue(request):
    # Get vehicles that have tickets with status 'ISSUED'
    vehicles_with_issued_tickets = Vehicle.objects.filter(
        tickets__status='ISSUED',
        is_archived=False
    ).distinct().select_related('route', 'active_driver')

    data = []
    for vehicle in vehicles_with_issued_tickets:
        # Get the latest issued ticket for departure time
        latest_ticket = vehicle.tickets.filter(status='ISSUED').order_by('-issued_at').first()
        departure_time = None
        if latest_ticket:
            # Convert to local time (PH time = UTC+8)
            local_dt = latest_ticket.issued_at + timedelta(hours=8)
            departure_time = local_dt.strftime('%I:%M %p')

        data.append({
            'id': vehicle.id,
            'plate_number': vehicle.plate_number,
            'driver': vehicle.active_driver.name if vehicle.active_driver else '',
            'route': vehicle.route.full_name if vehicle.route else '',
            'status': vehicle.get_status_display(),
            'departure_time': departure_time,
        })

    return Response(data)


@api_view(['GET'])
def server_time(request):
    """Return current server time in ISO format"""
    now = timezone.now()
    return Response({'time': now.isoformat()})

@api_view(['GET'])
def late_issue_records(request):
    """Fetch all vehicles and drivers for late issue tickets (bypass status filters)"""
    try:
        vehicles = Vehicle.objects.select_related('route', 'active_driver').filter(is_archived=False).order_by('code')
        drivers = Driver.objects.filter(is_archived=False).order_by('code')

        vehicle_data = [
            {
                'id': v.id,
                'code': v.code,
                'plate_number': v.plate_number,
                'route': v.route.full_name if v.route else '—',
                'driver': v.active_driver.name if v.active_driver else '—',
                'status': v.get_status_display(),
            }
            for v in vehicles
        ]

        driver_data = [
            {
                'id': d.id,
                'code': d.code,
                'name': d.name,
                'contact_number': getattr(d, 'contact', '—'),
                'status': d.status,
            }
            for d in drivers
        ]

        return Response({
            'vehicles': vehicle_data,
            'drivers': driver_data,
            'total_vehicles': len(vehicle_data),
            'total_drivers': len(driver_data),
        })
    except Exception as e:
        return Response({'error': str(e)}, status=500)
