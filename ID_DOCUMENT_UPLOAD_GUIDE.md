# ID Document Upload Feature

## Overview
Tenants can now upload or replace their government ID documents from their profile settings, even after completing signup.

## Features Added

### Frontend (Tenant Settings Page)
- **Location**: `Makao-Center-V4/src/components/Tenant/TenantSettings.jsx`
- **New Section**: "ID Document" card between "Move-in Date" and "Change Password"

#### Features:
1. **Current Document Display**
   - Shows if a document is already uploaded
   - Displays document filename
   - "View" button to open document in new tab

2. **No Document Warning**
   - Yellow alert when no document is uploaded
   - Encourages users to upload for verification

3. **Upload/Replace Form**
   - File input supporting PDF, JPEG, JPG, PNG
   - Max file size: 5MB
   - Live validation with helpful error messages
   - Shows selected filename before upload
   - Upload button disabled until file is selected

4. **Security Notice**
   - Information box explaining document usage and privacy

### Backend (User Update Endpoint)
- **Location**: `Makau Rentals/app/accounts/serializers.py`
- **Endpoint**: `PUT /api/accounts/users/<user_id>/update/`

#### Changes:
1. **UserSerializer Enhancement**
   - Accepts base64 encoded documents in update requests
   - Automatically decodes and saves to FileField
   - Handles both images and PDFs
   - Logs successful uploads
   - Gracefully handles upload failures without breaking other updates

## How It Works

### Tenant Flow:
1. Log in to tenant account
2. Navigate to Settings
3. Scroll to "ID Document" section
4. Click "Choose File" and select a PDF/image (max 5MB)
5. Click "Upload Document" or "Replace Document"
6. Document is uploaded and confirmation message appears
7. Document becomes visible to landlord in tenant details

### Technical Flow:
1. Frontend converts file to base64 using FileReader API
2. Sends base64 string via PUT request to `/api/accounts/users/<user_id>/update/`
3. UserSerializer intercepts base64 data in `to_internal_value()`
4. In `update()` method, base64 is decoded and saved as file
5. File stored in `/media/id_documents/` directory
6. Full URL returned to frontend for display

## API Usage

### Request
```http
PUT /api/accounts/users/123/update/
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "id_document": "data:application/pdf;base64,JVBERi0xLjQKJeLjz9..."
}
```

### Response
```json
{
  "id": 123,
  "email": "tenant@example.com",
  "full_name": "John Doe",
  "id_document": "/media/id_documents/123_John_Doe_id.pdf",
  ...
}
```

## File Storage

### Development
- Files saved to: `Makau Rentals/app/media/id_documents/`
- Served at: `http://localhost:8000/media/id_documents/`
- Naming: `{user_id}_{name}_id.{extension}`

### Production Requirements
1. Configure Django settings:
   ```python
   MEDIA_URL = '/media/'
   MEDIA_ROOT = os.path.join(BASE_DIR, 'media')
   ```

2. Serve media files (nginx example):
   ```nginx
   location /media/ {
       alias /path/to/media/;
   }
   ```

3. Consider cloud storage (S3, Google Cloud Storage) for production

## Validation

### Frontend Validation:
- File type: PDF, JPEG, JPG, PNG only
- File size: Maximum 5MB
- Provides immediate feedback to user

### Backend Validation:
- Handled by Django FileField
- Additional size limits can be added in settings

## Security Considerations

1. **Authentication Required**: Only logged-in users can upload
2. **Authorization Check**: Users can only update their own documents
3. **File Type Validation**: Limited to safe document/image types
4. **Size Limits**: Prevents DOS attacks via large uploads
5. **Secure Storage**: Files stored outside web root in production
6. **Access Control**: Documents only visible to landlord and tenant

## Testing

### Manual Testing Steps:
1. Create/login as tenant
2. Go to Settings → ID Document
3. Try uploading:
   - Valid PDF (should succeed)
   - Valid JPG (should succeed)
   - Large file >5MB (should show error)
   - Invalid type like .txt (should show error)
4. Verify document appears in landlord's tenant details view
5. Try replacing document (should work)
6. Check media folder for saved file

### API Testing:
```bash
# Get auth token first
curl -X POST http://localhost:8000/api/accounts/token/ \
  -H "Content-Type: application/json" \
  -d '{"email":"tenant@example.com","password":"password123","user_type":"tenant"}'

# Upload document (use actual base64 string)
curl -X PUT http://localhost:8000/api/accounts/users/123/update/ \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{"id_document":"data:application/pdf;base64,..."}'
```

## Troubleshooting

### "Failed to upload document"
- Check file size (must be ≤5MB)
- Verify file type (PDF, JPG, JPEG, PNG only)
- Check browser console for specific error
- Verify user is authenticated

### Document not appearing in landlord view
- Ensure `buildMediaUrl()` helper is imported
- Check MEDIA_URL and MEDIA_ROOT settings
- Verify file exists in media/id_documents/
- Check browser network tab for 404s

### Backend errors
- Check Django logs for detailed error messages
- Verify migrations are applied: `python manage.py migrate`
- Ensure MEDIA_ROOT directory is writable
- Check base64 decoding in serializer logs

## Future Enhancements

1. **Multiple Documents**: Allow multiple document types (passport, utility bills, etc.)
2. **Document Verification**: Add admin approval workflow for documents
3. **OCR Integration**: Automatically extract ID details from documents
4. **Expiry Tracking**: Track document expiry dates and send reminders
5. **Cloud Storage**: Integrate with AWS S3 or similar for production
6. **Image Compression**: Automatically compress large images
7. **Document History**: Keep audit trail of document changes

## Related Files

### Frontend:
- `Makao-Center-V4/src/components/Tenant/TenantSettings.jsx` - UI component
- `Makao-Center-V4/src/components/Admin/TenantDetailsPage.jsx` - Landlord view
- `Makao-Center-V4/src/services/api.js` - API helpers

### Backend:
- `Makau Rentals/app/accounts/serializers.py` - UserSerializer with document handling
- `Makau Rentals/app/accounts/views.py` - UpdateUserView endpoint
- `Makau Rentals/app/accounts/models.py` - CustomUser model with id_document field
- `Makau Rentals/app/accounts/urls.py` - URL routing

## Migration Applied
- `0007_alter_customuser_id_document_to_filefield.py` - Changed ImageField to FileField for PDF support
