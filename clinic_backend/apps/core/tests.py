from django.test import TestCase
from apps.core.models import BaseModel
from django.db import models

class TestModel(BaseModel):
    name = models.CharField(max_length=100)

    class Meta:
        app_label = 'core'


class BaseModelTestCase(TestCase):
    def test_create_base_model(self):
        obj = TestModel.objects.create(name="Test Item")
        self.assertIsNotNone(obj.id)
        self.assertIsNotNone(obj.created_at)
        self.assertFalse(obj.is_deleted)

    def test_soft_delete(self):
        obj = TestModel.objects.create(name="Test Soft Delete")
        obj.delete()
        
        self.assertTrue(obj.is_deleted)
        self.assertEqual(TestModel.objects.count(), 0)
        self.assertEqual(TestModel.all_objects.count(), 1)
        self.assertEqual(TestModel.objects.deleted_only().count(), 1)

    def test_restore_soft_delete(self):
        obj = TestModel.objects.create(name="Test Restore")
        obj.delete()
        self.assertEqual(TestModel.objects.count(), 0)
        
        obj.restore()
        self.assertFalse(obj.is_deleted)
        self.assertEqual(TestModel.objects.count(), 1)
